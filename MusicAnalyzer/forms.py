from django import forms


class MultipleFilesForm (forms.Form):
    files = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}), label="Files", required=False)


class FileForm(forms.Form):
    file = forms.FileField(widget=forms.ClearableFileInput(), label="File", required=False)


class SearchForm (forms.Form):
    free_search = forms.CharField(max_length=500, required=False)
    composer = forms.CharField(max_length=150, required=False)
    title = forms.CharField(max_length=200, required=False)
    start_year = forms.IntegerField(max_value=9999, min_value=0, required=False)
    end_year = forms.IntegerField(max_value=9999, min_value=0, required=False)
