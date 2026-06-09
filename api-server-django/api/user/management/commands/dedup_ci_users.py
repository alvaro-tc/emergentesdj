"""
Management command: dedup_ci_users

Elimina usuarios duplicados por ci_number conservando únicamente el que tiene
al menos una inscripción con final_grade no nulo.

Uso:
    python manage.py dedup_ci_users            # dry-run (por defecto, no borra)
    python manage.py dedup_ci_users --commit   # borrado real dentro de transacción

Reglas:
- Ignora ci_number nulos o vacíos.
- Solo borra las copias sin nota cuando exista al menos otra copia del mismo
  ci_number que SÍ tenga final_grade IS NOT NULL.
- Si ninguna copia del grupo tiene nota, el grupo se reporta para revisión
  manual y no se toca.
"""

from __future__ import annotations

from typing import TypedDict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Exists, OuterRef, Subquery

from api.user.models import User
from api.school.models import Enrollment


class UserInfo(TypedDict):
    id: int
    ci_number: str
    email: str | None
    full_name: str


class Command(BaseCommand):
    help = "Elimina usuarios duplicados por ci_number sin calificación registrada."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--commit",
            action="store_true",
            default=False,
            help="Ejecuta el borrado real. Sin este flag solo se hace dry-run.",
        )

    def handle(self, *args, **options) -> None:
        commit: bool = options["commit"]

        if commit:
            self.stdout.write(self.style.WARNING("Modo: BORRADO REAL (--commit activado)"))
        else:
            self.stdout.write(self.style.NOTICE("Modo: DRY-RUN (sin --commit, no se borrará nada)"))

        # Subquery: el usuario tiene al menos una inscripción con final_grade no nulo
        has_graded_enrollment = Exists(
            Enrollment.objects.filter(
                student=OuterRef("pk"),
                final_grade__isnull=False,
            )
        )

        # Obtener todos los ci_number duplicados (no nulos, no vacíos)
        from django.db.models import Count
        duplicate_ci_qs = (
            User.objects.exclude(ci_number__isnull=True)
            .exclude(ci_number="")
            .values("ci_number")
            .annotate(cnt=Count("id"))
            .filter(cnt__gt=1)
            .values_list("ci_number", flat=True)
        )
        duplicate_cis: list[str] = list(duplicate_ci_qs)

        if not duplicate_cis:
            self.stdout.write(self.style.SUCCESS("No se encontraron ci_number duplicados."))
            return

        self.stdout.write(f"\nGrupos con ci_number duplicado encontrados: {len(duplicate_cis)}\n")

        to_delete: list[UserInfo] = []
        unresolved_groups: list[tuple[str, list[UserInfo]]] = []

        for ci in sorted(duplicate_cis):
            users_in_group = list(
                User.objects.filter(ci_number=ci)
                .annotate(has_grade=has_graded_enrollment)
                .order_by("id")
            )

            with_grade = [u for u in users_in_group if u.has_grade]  # type: ignore[attr-defined]
            without_grade = [u for u in users_in_group if not u.has_grade]  # type: ignore[attr-defined]

            group_info = [self._user_info(u) for u in users_in_group]

            if not with_grade:
                # Ninguno tiene nota → dejar para revisión manual
                unresolved_groups.append((ci, group_info))
                continue

            # Al menos uno tiene nota → los sin nota son candidatos a borrar
            for u in without_grade:
                to_delete.append(self._user_info(u))

        # ── Reporte ────────────────────────────────────────────────────────────
        self.stdout.write("=" * 70)
        self.stdout.write(f"Usuarios a ELIMINAR ({len(to_delete)}):")
        if to_delete:
            for info in to_delete:
                self.stdout.write(
                    f"  id={info['id']}  ci={info['ci_number']}  "
                    f"email={info['email'] or '(sin email)'}  "
                    f"nombre={info['full_name'] or '(sin nombre)'}"
                )
        else:
            self.stdout.write("  (ninguno)")

        self.stdout.write("")
        self.stdout.write(f"Grupos sin resolver (ningún miembro tiene nota): {len(unresolved_groups)}")
        if unresolved_groups:
            for ci, members in unresolved_groups:
                self.stdout.write(f"  ci_number={ci}:")
                for info in members:
                    self.stdout.write(
                        f"    id={info['id']}  email={info['email'] or '(sin email)'}  "
                        f"nombre={info['full_name'] or '(sin nombre)'}"
                    )
        self.stdout.write("=" * 70)

        if not to_delete:
            self.stdout.write(self.style.SUCCESS("Nada que borrar."))
            return

        if not commit:
            self.stdout.write(
                self.style.NOTICE(
                    "\nDRY-RUN completado. Ejecuta con --commit para borrar los usuarios listados."
                )
            )
            return

        # ── Borrado real ───────────────────────────────────────────────────────
        ids_to_delete = [info["id"] for info in to_delete]
        with transaction.atomic():
            deleted_count, _ = User.objects.filter(id__in=ids_to_delete).delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nBorrado completado: {deleted_count} objeto(s) eliminado(s) "
                    f"(usuarios + registros en cascada)."
                )
            )

    @staticmethod
    def _user_info(user: User) -> UserInfo:
        return UserInfo(
            id=user.pk,
            ci_number=user.ci_number or "",
            email=user.email,
            full_name=user.get_full_name(),
        )
