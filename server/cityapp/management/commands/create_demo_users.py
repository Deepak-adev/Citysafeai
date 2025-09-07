from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from cityapp.models import UserProfile

class Command(BaseCommand):
    help = 'Create demo users for testing'

    def handle(self, *args, **options):
        # Create demo police user
        if not User.objects.filter(username='officer_demo').exists():
            user = User.objects.create_user(
                username='officer_demo',
                password='Police123',
                email='officer.demo@police.gov'
            )
            
            user_profile = UserProfile.objects.create(
                user=user,
                username='officer_demo',
                email='officer.demo@police.gov',
                phone='+1234567890',
                role='police',
                police_id='TN001',
                police_rank='Inspector'
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Police user created: {user_profile.username} (ID: {user_profile.id})')
            )
        else:
            self.stdout.write('Police user already exists')

        # Create demo public user
        if not User.objects.filter(username='demo').exists():
            user = User.objects.create_user(
                username='demo',
                password='Demo123',
                email='demo@example.com'
            )
            
            user_profile = UserProfile.objects.create(
                user=user,
                username='demo',
                email='demo@example.com',
                phone='+1234567890',
                role='public'
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Public user created: {user_profile.username} (ID: {user_profile.id})')
            )
        else:
            self.stdout.write('Public user already exists')
