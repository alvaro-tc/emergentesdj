# Gunicorn config for low-memory VPS (2GB RAM)
# Run with: gunicorn core.wsgi:application -c gunicorn.conf.py

import multiprocessing

# Workers: for 2GB RAM, 2 workers is the sweet spot
# (formula: 2 * CPUs + 1, but cap at 2-3 for 2GB RAM)
workers = 2
worker_class = "sync"

# Timeout: bulk enrollment of 200+ students can take 30-60s
# Default is 30s — increase to avoid 500 on large uploads
timeout = 120

# Max request size: allow Excel files up to 10MB
limit_request_line = 0

# Keep memory usage low by restarting workers periodically
max_requests = 500
max_requests_jitter = 50

# Bind
bind = "0.0.0.0:5005"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
