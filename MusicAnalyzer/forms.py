from django import forms

from MusicAnalyzer.constants import Analysis, ChordRepresentation


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
    analysis_choices = [(Analysis.chords.value, 'Chords'),
                        (Analysis.intervals.value, 'Intervals'),
                        (Analysis.leading_notes.value, 'Leading notes'),
                        (Analysis.ambitus.value, 'Ambitus'),
                        (Analysis.key.value, 'Key')
                        ]
    individual_analysis = forms.TypedMultipleChoiceField(choices = analysis_choices, coerce=int,
                                                    label="Choose metrics to analyze:",
                                                    widget=forms.CheckboxSelectMultiple)



class KeyFrom(forms.Form):
    pass


class ChordRepresentationForm(forms.Form):
    representation_choices = [(ChordRepresentation.roman.value, 'roman numerals'),
                              (ChordRepresentation.chord_name.value, 'chord names'),
                              ]
    chord_representation = forms.TypedChoiceField(choices=representation_choices, coerce=int,
                                                  label="Choose the type of chord representation:",
                                                  widget=forms.RadioSelect, required=False)
