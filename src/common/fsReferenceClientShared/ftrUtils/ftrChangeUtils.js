(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrChangeUtils', function (fsApi, fsChangeUtils) {

      return {
        isChangeOfInterest: function(change) {

          var type = fsChangeUtils.getType(change);
          var objectType = fsChangeUtils.getModifiedObjectType(change);

          if (objectType !== 'http://gedcomx.org/Person') {
            return false;
          }

          var interested = false;

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
            case 'http://familysearch.org/v1/Affiliation':
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
            case 'http://gedcomx.org/MilitaryService':
            case 'http://gedcomx.org/Naturalization':
            case 'http://gedcomx.org/Occupation':
            case 'http://gedcomx.org/Religion':
            case 'http://gedcomx.org/Residence':
            case 'http://gedcomx.org/Stillbirth':
            case 'http://gedcomx.org/Fact':
            case 'http://gedcomx.org/Caste':
            case 'http://gedcomx.org/Clan':
            case 'http://gedcomx.org/NationalId':
            case 'http://gedcomx.org/Nationality':
            case 'http://gedcomx.org/PhysicalDescription':
            case 'http://gedcomx.org/Ethnicity':
            case 'http://gedcomx.org/Gender':
            case 'http://gedcomx.org/Name':
            case 'http://gedcomx.org/BirthName':
            case 'http://gedcomx.org/AlsoKnownAs':
            case 'http://gedcomx.org/MarriedName':
            case 'http://gedcomx.org/Nickname':
            case 'http://familysearch.org/v1/DiedBeforeEight':
            case 'http://familysearch.org/v1/TribeName':
            case 'http://familysearch.org/v1/BirthOrder':
            case 'http://familysearch.org/v1/LifeSketch':
            case 'http://familysearch.org/v1/TitleOfNobility':
            case 'http://familysearch.org/v1/Baptism':
            case 'http://familysearch.org/v1/Confirmation':
            case 'http://familysearch.org/v1/Initiatory':
            case 'http://familysearch.org/v1/Endowment':
            case 'http://familysearch.org/v1/Sealing':
            case 'http://familysearch.org/v1/NotAMatch':
              interested = true;
              break;
            case 'http://gedcomx.org/Note':
            case 'http://familysearch.org/v1/DiscussionReference':
            case 'http://familysearch.org/v1/LivingStatus':
              interested = false;
              break;
            default:
              console.log('Unhandled Change type: ' + type);
              break;
          }

          // if (interested) {
          //   console.log('keeping ' + type);
          // } else {
          //   console.log('discarding ' + type);
          // }

          return interested;
        }

      };
    });
})();