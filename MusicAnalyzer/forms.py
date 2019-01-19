from django import forms


class FileForm (forms.Form):
    files = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}), label="Files", required=False)


class SearchForm (forms.Form):
    composer = forms.CharField(max_length=150, required=False)
    title = forms.CharField(max_length=200, required=False)
    start_year = forms.IntegerField(max_value=9999, min_value=0, required=False)
    end_year = forms.IntegerField(max_value=9999, min_value=0, required=False)