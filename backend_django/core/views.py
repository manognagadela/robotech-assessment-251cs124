from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Announcement, GalleryImage, Sponsorship, ContactMessage
from .serializers import AnnouncementSerializer, GalleryImageSerializer, SponsorshipSerializer, ContactMessageSerializer
from users.permissions import GlobalPermission

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [GlobalPermission]

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        ann = self.get_object()
        ann.published_at = timezone.now()
        ann.save()
        return Response({'status': 'published'})

class GalleryViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all().order_by('-uploaded_at')
    serializer_class = GalleryImageSerializer
    permission_classes = [GlobalPermission]

    @action(detail=False, methods=['post'])
    def upload(self, request):
        images = request.FILES.getlist('images')
        created = []
        for img in images:
            obj = GalleryImage.objects.create(image=img, uploaded_by=request.user)
            created.append(obj)
        return Response(GalleryImageSerializer(created, many=True).data)

    @action(detail=True, methods=['delete'])
    def image(self, request, pk=None):
        return self.destroy(request, pk)

class SponsorshipViewSet(viewsets.ModelViewSet):
    queryset = Sponsorship.objects.all().order_by('-created_at')
    serializer_class = SponsorshipSerializer
    permission_classes = [GlobalPermission]

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    permission_classes = [GlobalPermission]
