import os
from channels.routing import get_default_application
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django_asgi_app = get_asgi_application()

import core.routing

application = core.routing.application
