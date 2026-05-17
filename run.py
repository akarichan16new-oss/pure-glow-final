# -*- coding: utf-8 -*-
"""
PureGlow AI - Application Entry Point
=======================================

Run this file to start the Flask API.

    Development (auto-reload):
        python run.py

    Choose environment:
        python run.py --env production
        FLASK_ENV=production python run.py

    Override port:
        python run.py --port 8080
        PORT=8080 python run.py

    Production deployment (gunicorn):
        gunicorn --workers 4 --bind 0.0.0.0:5000 'run:app'

NEVER run app/__init__.py directly -- use this file from the project root.
"""

import argparse
import os
import sys
from pathlib import Path

# -- Ensure imports work when run from any directory --------------------------
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))


# ============================================================================
# Pre-flight checks
# ============================================================================

def _check_dependencies() -> None:
    """Verify required Python packages are installed before starting."""
    missing = []
    for pkg, import_name in [
        ('Flask',       'flask'),
        ('flask-cors',  'flask_cors'),
        ('pandas',      'pandas'),
        ('numpy',       'numpy'),
        ('python-dotenv', 'dotenv'),
    ]:
        try:
            __import__(import_name)
        except ImportError:
            missing.append(pkg)

    if missing:
        print('=' * 70)
        print('  ERROR: Missing required packages:')
        for pkg in missing:
            print(f'    - {pkg}')
        print()
        print('  Install them with:')
        print('    pip install -r requirements.txt')
        print('=' * 70)
        sys.exit(1)


def _check_project_layout() -> None:
    """Verify the expected project folders and files exist."""
    expected = {
        'app/':                            PROJECT_ROOT / 'app',
        'app/__init__.py':                 PROJECT_ROOT / 'app' / '__init__.py',
        'app/config.py':                   PROJECT_ROOT / 'app' / 'config.py',
        'src/recommendation_engine.py':    PROJECT_ROOT / 'src' / 'recommendation_engine.py',
        'models/skincare_products.csv':    PROJECT_ROOT / 'models' / 'skincare_products.csv',
        'models/colour_config.json':       PROJECT_ROOT / 'models' / 'colour_config.json',
    }

    missing = [name for name, path in expected.items() if not path.exists()]

    if missing:
        print('=' * 70)
        print('  WARNING: Some expected project files are missing:')
        for name in missing:
            print(f'    - {name}')
        print()
        if 'models/skincare_products.csv' in missing or 'models/colour_config.json' in missing:
            print('  Model files are missing. The API will start but the engine')
            print('  will be unavailable. Run notebook 03 to generate them:')
            print('    jupyter notebook notebooks/03_recommendation_model.ipynb')
        print('=' * 70)
        print()


# ============================================================================
# Argument parsing
# ============================================================================

def _parse_args() -> argparse.Namespace:
    """Parse command-line arguments. Env vars take precedence if --x not set."""
    parser = argparse.ArgumentParser(
        prog='run.py',
        description='Start the PureGlow AI Flask API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            'Examples:\n'
            '  python run.py                          # development on port 5000\n'
            '  python run.py --env production         # production mode\n'
            '  python run.py --port 8080              # custom port\n'
            '  python run.py --host 127.0.0.1         # bind localhost only\n'
            '  python run.py --no-reload              # disable auto-reload\n'
        ),
    )

    parser.add_argument(
        '--env',
        choices=['development', 'testing', 'production', 'dev', 'test', 'prod'],
        default=os.getenv('FLASK_ENV', 'development'),
        help='Configuration environment (default: development or $FLASK_ENV)',
    )
    parser.add_argument(
        '--host',
        default=None,
        help='Network interface to bind to (default: from config)',
    )
    parser.add_argument(
        '--port',
        type=int,
        default=None,
        help='Port to listen on (default: from config)',
    )
    parser.add_argument(
        '--no-reload',
        action='store_true',
        help='Disable Flask auto-reload (useful for debugging)',
    )

    return parser.parse_args()


# ============================================================================
# Startup banner
# ============================================================================

def _print_banner(app, host: str, port: int) -> None:
    """Print a friendly startup banner with quick-test URLs."""
    env = app.config.get('FLASK_ENV') or os.getenv('FLASK_ENV', 'development')
    debug = app.config.get('DEBUG', False)
    engine = getattr(app, 'engine', None)
    n_sk = len(engine.skincare_df) if engine is not None else 0
    n_mk = len(engine.makeup_df)   if engine is not None else 0

    print()
    print('=' * 70)
    print('   PureGlow AI -- Recommendation API')
    print('=' * 70)
    print(f'   Environment : {env}')
    print(f'   Debug mode  : {debug}')
    print(f'   Engine      : {"loaded (" + str(n_sk) + " skincare + " + str(n_mk) + " makeup)" if engine else "NOT LOADED -- check /health"}')
    print(f'   Listening   : http://{host}:{port}')
    print('-' * 70)
    print('   Quick test URLs:')
    base = f'http://localhost:{port}'
    print(f'     {base}/                       (API info)')
    print(f'     {base}/health                 (engine health report)')
    print(f'     {base}/api/info               (endpoints + valid inputs)')
    print(f'     {base}/api/stats              (catalogue stats)')
    print(f'     {base}/api/palette/all        (all colour palettes)')
    print('-' * 70)
    print('   Stop the server with Ctrl+C')
    print('=' * 70)
    print()


# ============================================================================
# Build the Flask app at module import time
# (so gunicorn can find it as `run:app`)
# ============================================================================

_check_dependencies()
_check_project_layout()

# Imported here -- after dependency check -- so a missing flask doesn't
# blow up before the friendly error message above.
from app import create_app   # noqa: E402

env_override = os.getenv('FLASK_ENV', 'development')
app = create_app(env_override)


# ============================================================================
# Main entry point
# ============================================================================

def main() -> None:
    args = _parse_args()

    # If --env was passed, rebuild the app with that environment
    global app
    if args.env != env_override:
        app = create_app(args.env)

    # Resolve host and port: CLI flags win over config, config wins over defaults
    host = args.host or app.config.get('HOST', '0.0.0.0')
    port = args.port or app.config.get('PORT', 5000)
    debug = app.config.get('DEBUG', False)
    use_reloader = debug and not args.no_reload

    _print_banner(app, host, port)

    try:
        app.run(
            host=host,
            port=port,
            debug=debug,
            use_reloader=use_reloader,
        )
    except OSError as e:
        if 'address already in use' in str(e).lower() or e.errno == 98:
            print(f'\nERROR: Port {port} is already in use.')
            print(f'  Either stop the other process, or run on a different port:')
            print(f'    python run.py --port {port + 1}\n')
            sys.exit(1)
        raise
    except KeyboardInterrupt:
        print('\n\nShutting down gracefully...\n')
        sys.exit(0)


if __name__ == '__main__':
    main()
