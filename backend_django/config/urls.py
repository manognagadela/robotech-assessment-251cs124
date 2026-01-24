from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

# Import URL patterns from apps
from users import urls as user_urls
from projects import urls as project_urls
from events import urls as events_urls
from core import urls as core_urls

# Merge patterns for /api/
# This allows 'users' and 'projects' to both register routes under /api/
# without one shadowing the other, assuming their router paths don't conflict.
api_patterns = user_urls.urlpatterns + project_urls.urlpatterns + events_urls.urlpatterns + core_urls.urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(api_patterns)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
