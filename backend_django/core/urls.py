from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnnouncementViewSet, GalleryViewSet, SponsorshipViewSet, ContactMessageViewSet

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcements')
router.register(r'gallery', GalleryViewSet, basename='gallery')
router.register(r'sponsorship', SponsorshipViewSet, basename='sponsorship')
router.register(r'contact-messages', ContactMessageViewSet, basename='contact-messages')

urlpatterns = [
    path('', include(router.urls)),
]
