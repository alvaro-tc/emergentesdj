import { useState, useCallback } from 'react';

/**
 * Standardizes CRUD dialog state: create/edit modal + delete confirmation.
 * Matches the selectedItem/openDialog/openDeleteDialog pattern used across admin views.
 *
 * Usage:
 *   const { open, selectedItem, isEditing, deleteOpen, itemToDelete,
 *           handleAdd, handleEdit, handleClose, handleDeleteRequest, handleDeleteClose } = useCRUDDialog();
 *
 *   <MyDialog open={open} item={selectedItem} isEditing={isEditing} onClose={handleClose} />
 *   <DeleteConfirmDialog open={deleteOpen} onClose={handleDeleteClose} onConfirm={() => doDelete(itemToDelete)} />
 */
export const useCRUDDialog = () => {
    const [open, setOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleAdd = useCallback(() => {
        setSelectedItem(null);
        setOpen(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setSelectedItem(item);
        setOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
        setSelectedItem(null);
    }, []);

    const handleDeleteRequest = useCallback((idOrItem) => {
        setItemToDelete(idOrItem);
        setDeleteOpen(true);
    }, []);

    const handleDeleteClose = useCallback(() => {
        setDeleteOpen(false);
        setItemToDelete(null);
    }, []);

    return {
        open,
        selectedItem,
        isEditing: selectedItem !== null,
        deleteOpen,
        itemToDelete,
        handleAdd,
        handleEdit,
        handleClose,
        handleDeleteRequest,
        handleDeleteClose,
    };
};
