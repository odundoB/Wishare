from rest_framework import serializers
from typing import Dict, List, Any


class SearchResultSerializer(serializers.Serializer):
    """Serializer for individual search results."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    type = serializers.CharField()
    subtype = serializers.CharField(required=False, allow_null=True)
    subject = serializers.CharField(required=False, allow_null=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)
    uploaded_by = serializers.CharField(required=False, allow_null=True)
    uploaded_by_role = serializers.CharField(required=False, allow_null=True)
    is_public = serializers.BooleanField(required=False)
    download_count = serializers.IntegerField(required=False)
    created_at = serializers.DateTimeField()
    url = serializers.URLField()
    file_url = serializers.URLField(required=False, allow_null=True)
    external_url = serializers.URLField(required=False, allow_null=True)
    username = serializers.CharField(required=False, allow_null=True)
    email = serializers.EmailField(required=False, allow_null=True)
    role = serializers.CharField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)


class AppSearchResultsSerializer(serializers.Serializer):
    """Serializer for search results from a specific app."""
    app_name = serializers.CharField()
    app_display_name = serializers.CharField()
    results = SearchResultSerializer(many=True)
    total_count = serializers.IntegerField()
    has_more = serializers.BooleanField()
    search_fields = serializers.ListField(child=serializers.CharField())
    error = serializers.CharField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_null=True)


class SearchMetadataSerializer(serializers.Serializer):
    """Serializer for search metadata."""
    searched_apps = serializers.ListField(child=serializers.CharField())
    total_apps_searched = serializers.IntegerField()
    execution_time = serializers.FloatField()


class SearchResponseSerializer(serializers.Serializer):
    """Main serializer for search API responses."""
    query = serializers.CharField()
    total_results = serializers.IntegerField()
    results_by_type = serializers.DictField(
        child=AppSearchResultsSerializer()
    )
    search_metadata = SearchMetadataSerializer()


class SearchRequestSerializer(serializers.Serializer):
    """Serializer for search request validation."""
    query = serializers.CharField(
        max_length=200,
        help_text="Search keyword or phrase"
    )
    app_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            'resources', 'articles', 'forum', 'jobs', 'users'
        ]),
        required=False,
        allow_empty=True,
        help_text="List of app types to search (empty = all apps)"
    )
    limit_per_app = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=50,
        help_text="Maximum results per app type"
    )
    include_suggestions = serializers.BooleanField(
        default=False,
        help_text="Include search suggestions in response"
    )


class SearchSuggestionSerializer(serializers.Serializer):
    """Serializer for search suggestions."""
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of search suggestions"
    )


class PopularSearchSerializer(serializers.Serializer):
    """Serializer for popular search terms."""
    term = serializers.CharField()
    count = serializers.IntegerField()


class PopularSearchesSerializer(serializers.Serializer):
    """Serializer for popular searches response."""
    popular_searches = serializers.ListField(
        child=PopularSearchSerializer()
    )


class SearchStatsSerializer(serializers.Serializer):
    """Serializer for search statistics."""
    total_searches_today = serializers.IntegerField()
    total_searches_this_week = serializers.IntegerField()
    total_searches_this_month = serializers.IntegerField()
    most_searched_terms = serializers.ListField(
        child=PopularSearchSerializer()
    )
    most_active_apps = serializers.ListField(
        child=serializers.DictField()
    )


class AdvancedSearchSerializer(serializers.Serializer):
    """Serializer for advanced search functionality."""
    query = serializers.CharField(max_length=200)
    app_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            'resources', 'articles', 'forum', 'jobs', 'users'
        ]),
        required=False
    )
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    subject = serializers.CharField(required=False)
    resource_type = serializers.ChoiceField(
        choices=['file', 'url'],
        required=False
    )
    is_public = serializers.BooleanField(required=False)
    uploaded_by = serializers.IntegerField(required=False)
    tags = serializers.CharField(required=False)
    sort_by = serializers.ChoiceField(
        choices=['relevance', 'date', 'title', 'downloads'],
        default='relevance'
    )
    sort_order = serializers.ChoiceField(
        choices=['asc', 'desc'],
        default='desc'
    )
    limit_per_app = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=50
    )
