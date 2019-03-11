from django import forms

from MusicAnalyzer.constants import Analysis


class MultipleFilesForm(forms.Form):
    files = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}), label="Files", required=False)


class FileForm(forms.Form):
    file = forms.FileField(widget=forms.ClearableFileInput(), label="File", required=False)


class SearchForm(forms.Form):
    free_search = forms.CharField(max_length=500, widget=forms.TextInput(attrs={'class': 'uk-input'}), required=False)
    composer = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'class': 'uk-input'}), required=False)
    title = forms.CharField(max_length=200, widget=forms.TextInput(attrs={'class': 'uk-input'}), required=False)
    start_year = forms.IntegerField(max_value=9999, min_value=0, widget=forms.TextInput(attrs={'class': 'uk-input'}),
                                    required=False)
    end_year = forms.IntegerField(max_value=9999, min_value=0, widget=forms.TextInput(attrs={'class': 'uk-input'}),
                                  required=False)


class IndividualAnalysisForm(forms.Form):
    analysis_choices = [(Analysis.chords.value, 'chords'),
                        (Analysis.intervals.value, 'intervals'),
                        (Analysis.leading_notes.value, 'leading notes'),
                        (Analysis.ambitus.value, 'ambitus'),
                        (Analysis.key.value, 'key')
                        ]
    individual_analysis = forms.TypedMultipleChoiceField(choices = analysis_choices, coerce=int,
                                                    label="Choose metrics to analyse:",
                                                    widget=forms.CheckboxSelectMultiple)



class KeyFrom(forms.Form):
    pass
