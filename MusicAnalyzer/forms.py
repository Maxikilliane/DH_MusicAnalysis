# from django import forms
# from django.forms import BaseFormSet
#
# from MusicAnalyzer.constants import Analysis, ChordRepresentation, State
# from MusicAnalyzer.models import DistantHearingGroup, DjangoSession
#
#
# class MultipleFilesForm(forms.Form):
#     files = forms.FileField(widget=forms.ClearableFileInput(attrs={'multiple': True}), label="Files", required=False)
#
#
# class FileForm(forms.Form):
#     file = forms.FileField(widget=forms.ClearableFileInput(), label="File", required=False)
#
#
# class SearchForm(forms.Form):
#     free_search = forms.CharField(max_length=500, widget=forms.TextInput(attrs={'class': 'uk-input'}), required=False)
#     composer = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'class': 'uk-input'}), required=False)
#     title = forms.CharField(max_length=200, widget=forms.TextInput(attrs={'class': 'uk-input'}), required=False)
#     start_year = forms.IntegerField(max_value=9999, min_value=0, widget=forms.TextInput(attrs={'class': 'uk-input'}),
#                                     required=False)
#     end_year = forms.IntegerField(max_value=9999, min_value=0, widget=forms.TextInput(attrs={'class': 'uk-input'}),
#                                   required=False)
#
#
# class AddGroupForm(forms.ModelForm):
#     name = forms.CharField(label="", max_length=50, required=True,
#                            widget=forms.TextInput(attrs={'class': 'uk-input', 'placeholder': 'group name'}))
#
#     class Meta:
#         model = DistantHearingGroup
#         # exclude = ('testPerson', )
#         fields = ('name',)
#
#
# class MusicChoiceForm(forms.Form):
#     is_selected = forms.BooleanField(required=False)
#     path_to_source = forms.CharField(widget=forms.Textarea)
#     file_source = forms.CharField(max_length=15)
#     number = forms.IntegerField(required=False)
#     group_choice = forms.ChoiceField(label="", required=False)
#
#     def __init__(self, session_key, *args, **kwargs):
#         super(MusicChoiceForm, self).__init__(*args, **kwargs)
#         self.fields['group_choice'] = forms.ModelChoiceField(queryset=self.get_group_choices(session_key), label="", required=False)
#
#     # get choices for key_choice_form
#     def get_group_choices(self, session_key):
#         current_session = DjangoSession.objects.get(session_key=session_key)
#         return DistantHearingGroup.objects.filter(ref_django_session=current_session)
#
#
# class MusicChoicessFormSet(BaseFormSet):
#      def clean(self)  :
#          if any(self.errors):
#              # Don't bother validating the formset unless each form is valid on its own
#              return
#          music_pieces = []
#          for form in self.forms:
#              titles = []
#              title = form.cleaned_data['title']
#              if title in titles:
#                  raise forms.ValidationError("Articles in a set must have distinct titles.")
#              titles.append(title)
#
#
# class IndividualAnalysisForm(forms.Form):
#     analysis_choices = [(Analysis.chords.value, 'Chords'),
#                         (Analysis.ambitus.value, 'Ambitus'),
#                         (Analysis.key.value, 'Key')
#                         ]
#     individual_analysis = forms.TypedMultipleChoiceField(choices=analysis_choices, coerce=int,
#                                                          label="Choose metrics to analyse:",
#                                                          widget=forms.CheckboxSelectMultiple)
#
#
# class KeyForm(forms.Form):
#     key_choice = forms.ChoiceField(label="Choose which key you want to use:", widget=forms.RadioSelect)
#
#     def __init__(self, key_list, *args, **kwargs):
#         super(KeyForm, self).__init__(*args, **kwargs)
#         self.fields['key_choice'] = forms.ChoiceField(choices=self.get_key_choices(key_list),
#                                                       widget=forms.RadioSelect,
#                                                       label="Possible keys with their probability:")
#     # get choices for key_choice_form
#     def get_key_choices(self, key_list):
#         key_choices = []
#         for key in key_list:
#             key_name = get_better_key_name(key)
#             user_representation = key_name + " (" + str(round(key.correlationCoefficient, 4)) + ")"
#             key_choices.append((key.tonicPitchNameWithCase, user_representation))
#
#         return key_choices
#
#
# def get_better_key_name(key):
#     key_name = key.name
#     sign = key_name[1]
#     if sign == "-":
#         sign = "b"
#         key_name = key_name[:1] + sign + key_name[2:]
#     key_name.replace("-", "b")
#     return key_name
#
#
# class ChordRepresentationForm(forms.Form):
#     representation_choices = [(ChordRepresentation.roman.value, 'roman numerals'),
#                               (ChordRepresentation.chord_name.value, 'chord names'),
#                               ]
#     chord_representation = forms.TypedChoiceField(choices=representation_choices, coerce=int,
#                                                   label="Choose the type of chord representation:",
#                                                   widget=forms.RadioSelect, required=False)
#
