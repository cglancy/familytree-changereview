(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrChangeDetails', function (fsApi, fsChangeUtils) {

      var factory = {};

      factory.getGenderString = function(type) {
        var str = 'Unknown';
        if (type === 'http://gedcomx.org/Female') {
          str = 'Female';
        }
        else if (type === 'http://gedcomx.org/Male') {
          str = 'Male';
        }
        return str;
      };

      factory.getContentRoot = function(change) {
        var obj;
        if (fsChangeUtils.isChildAndParentsRelationshipModified(change)) {
          obj = change.content.gedcomx['child-and-parents-relationships'];
        }
        else if (fsChangeUtils.isPersonModified(change)) {
          obj = change.content.gedcomx.persons;
        }
        else if (fsChangeUtils.isCoupleRelationshipModified(change)) {
          obj = change.content.gedcomx.relationships;
        }
        return obj;
      };

      factory.getChangeDetails = function(change) {

        var details = {
          original: {
            value:'',
            date:'',
            place:''
          }, 
          resulting: {
            value:'',
            date:'',
            place:''
          }
        };
        var type = fsChangeUtils.getType(change);
        var root = factory.getContentRoot(change);
        var isUpdate = change.changeInfo[0].operation === 'http://familysearch.org/v1/Update';
        var isDelete = fsChangeUtils.isDeletion(change);

        if (root) {
          switch (type) {
            case 'http://gedcomx.org/Person':
            case 'http://gedcomx.org/Couple':
            case 'http://familysearch.org/v1/ChildAndParentsRelationship':
            case 'http://familysearch.org/v1/Man':
            case 'http://familysearch.org/v1/Woman':
            case 'http://familysearch.org/v1/Father':
            case 'http://familysearch.org/v1/Mother':
            case 'http://familysearch.org/v1/Child':
            case 'http://gedcomx.org/SourceReference':
            case 'http://familysearch.org/v1/EvidenceReference':
              break;

            case 'http://gedcomx.org/Gender':
              if (isDelete) {
                details.original.value = factory.getGenderString(root[0].gender.type);
              }
              else if (isUpdate) {
                details.resulting.value = factory.getGenderString(root[0].gender.type);
                details.original.value = factory.getGenderString(root[1].gender.type);
              }
              else {
                details.resulting.value = factory.getGenderString(root[0].gender.type);
              }              
              break;
            case 'http://gedcomx.org/MilitaryService':
            case 'http://gedcomx.org/Occupation':
            case 'http://gedcomx.org/Religion':
            case 'http://gedcomx.org/Residence':
            case 'http://gedcomx.org/Caste':
            case 'http://gedcomx.org/Clan':
            case 'http://gedcomx.org/NationalId':
            case 'http://gedcomx.org/Nationality':
            case 'http://gedcomx.org/PhysicalDescription':
            case 'http://gedcomx.org/Ethnicity':
            case 'http://familysearch.org/v1/Affiliation':
            case 'http://familysearch.org/v1/TribeName':
            case 'http://familysearch.org/v1/DiedBeforeEight':
            case 'http://familysearch.org/v1/BirthOrder':
            case 'http://familysearch.org/v1/LifeSketch':
            case 'http://familysearch.org/v1/TitleOfNobility':
              if (isDelete) {
                details.original.value = root[0].facts[0].value;
              }
              else if (isUpdate) {
                details.resulting.value = root[0].facts[0].value;
                details.original.value = root[1].facts[0].value;
              }
              else {
                details.resulting.value = root[0].facts[0].value;
              }
              break;
            case 'http://gedcomx.org/Annulment':
            case 'http://gedcomx.org/BarMitzvah':
            case 'http://gedcomx.org/BatMitzvah':
            case 'http://gedcomx.org/Birth':
            case 'http://gedcomx.org/Burial':
            case 'http://gedcomx.org/Christening':
            case 'http://gedcomx.org/Cremation':
            case 'http://gedcomx.org/CommonLawMarriage':
            case 'http://gedcomx.org/Death':
            case 'http://gedcomx.org/Divorce':
            case 'http://gedcomx.org/Marriage':
            case 'http://gedcomx.org/Naturalization':
            case 'http://gedcomx.org/Stillbirth':
            case 'http://gedcomx.org/Fact':
            case 'http://familysearch.org/v1/Baptism':
            case 'http://familysearch.org/v1/Confirmation':
            case 'http://familysearch.org/v1/Initiatory':
            case 'http://familysearch.org/v1/Endowment':
            case 'http://familysearch.org/v1/Sealing':
              if (isDelete) {
                if ('date' in root[0].facts[0]) {
                  details.original.date = root[0].facts[0].date.normalized[0].value;
                }
                if ('place' in root[0].facts[0]) {
                  details.original.place = root[0].facts[0].place.normalized.value;
                }
              }
              else if (isUpdate) {
                if ('date' in root[0].facts[0]) {
                  details.resulting.date = root[0].facts[0].date.normalized[0].value;
                }
                if ('place' in root[0].facts[0]) {
                  details.resulting.place = root[0].facts[0].place.normalized.value;
                }
                if ('date' in root[1].facts[0]) {
                  details.original.date = root[1].facts[0].date.normalized[0].value;
                }
                if ('place' in root[1].facts[0]) {
                  details.original.place = root[1].facts[0].place.normalized.value;
                }
              }
              else {
                if ('date' in root[0].facts[0]) {
                  details.resulting.date = root[0].facts[0].date.normalized[0].value;
                }
                if ('place' in root[0].facts[0]) {
                  details.resulting.place = root[0].facts[0].place.normalized.value;
                }           
              }
              break;
            case 'http://gedcomx.org/Name':
            case 'http://gedcomx.org/BirthName':
            case 'http://gedcomx.org/AlsoKnownAs':
            case 'http://gedcomx.org/MarriedName':
            case 'http://gedcomx.org/Nickname':
              if (isDelete) {
                details.original.value = root[0].names[0].nameForms[0].fullText;
              }
              else if (isUpdate) {
                details.resulting.value = root[0].names[0].nameForms[0].fullText;  
                details.original.value = root[1].names[0].nameForms[0].fullText;
              }
              else {
                details.resulting.value = root[0].names[0].nameForms[0].fullText;
              }        
              break;
            case 'http://familysearch.org/v1/NotAMatch':
              break;
            case 'http://gedcomx.org/Note':
            case 'http://familysearch.org/v1/DiscussionReference':
            case 'http://familysearch.org/v1/LivingStatus':
              break;
            default:
              console.log('Unhandled Change type: ' + type);
              break;
          }
        }

        return details;
      };

      factory.getChangeHtml = function(change) {
        var html = '';
        var details = factory.getChangeDetails(change);

        if (details.original.value) {
          html += '<p>Original Value: ' + details.original.value + '</p>';
        }

        if (details.original.date) {
          html += '<p>Original Date: ' + details.original.date + '</p>';
        }

        if (details.original.place) {
          html += '<p>Original Place: ' + details.original.place + '</p>';
        }

        if (details.resulting.value) {
          html += '<p>Resulting Value: ' + details.resulting.value + '</p>';
        }

        if (details.resulting.date) {
          html += '<p>Resulting Date: ' + details.resulting.date + '</p>';
        }

        if (details.resulting.place) {
          html += '<p>Resulting Place: ' + details.resulting.place + '</p>';
        }

        return html;
      };

      return factory;
    });
})();