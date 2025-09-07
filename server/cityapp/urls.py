from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('route/', views.route_map, name='route_map'),
    path('api/crime-predictions/', views.get_crime_predictions, name='crime_predictions'),
]