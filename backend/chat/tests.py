from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Room, JoinRequest, Message

User = get_user_model()

class ChatModelsTest(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher1',
            email='teacher@test.com',
            password='testpass123',
            role='teacher'
        )
        self.student = User.objects.create_user(
            username='student1',
            email='student@test.com',
            password='testpass123',
            role='student'
        )

    def test_room_creation(self):
        room = Room.objects.create(
            name='Test Room',
            description='A test room',
            host=self.teacher
        )
        self.assertEqual(room.name, 'Test Room')
        self.assertEqual(room.host, self.teacher)
        self.assertTrue(room.is_active)

    def test_join_request_creation(self):
        room = Room.objects.create(
            name='Test Room',
            host=self.teacher
        )
        join_request = JoinRequest.objects.create(
            room=room,
            requester=self.student
        )
        self.assertEqual(join_request.room, room)
        self.assertEqual(join_request.requester, self.student)
        self.assertEqual(join_request.status, 'pending')

    def test_message_creation(self):
        room = Room.objects.create(
            name='Test Room',
            host=self.teacher
        )
        message = Message.objects.create(
            room=room,
            sender=self.student,
            content='Hello world!',
            message_type='text'
        )
        self.assertEqual(message.room, room)
        self.assertEqual(message.sender, self.student)
        self.assertEqual(message.content, 'Hello world!')
        self.assertEqual(message.message_type, 'text')


class ChatAPITest(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher1',
            email='teacher@test.com',
            password='testpass123',
            role='teacher'
        )
        self.student = User.objects.create_user(
            username='student1',
            email='student@test.com',
            password='testpass123',
            role='student'
        )

    def test_room_list_requires_auth(self):
        url = reverse('rooms-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_can_create_room(self):
        self.client.force_authenticate(user=self.teacher)
        url = reverse('rooms-create')
        data = {
            'name': 'Test Room',
            'description': 'A test room'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Room.objects.count(), 1)
        room = Room.objects.first()
        self.assertEqual(room.host, self.teacher)

    def test_student_cannot_create_room(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('rooms-create')
        data = {
            'name': 'Test Room',
            'description': 'A test room'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
