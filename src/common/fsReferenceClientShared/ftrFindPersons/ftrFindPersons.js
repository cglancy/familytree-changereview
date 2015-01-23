(function(){
  'use strict';
  angular.module('fsReferenceClientShared')

    .factory('ftrFindPersons', function($q, fsApi, $window, $firebase, ftrUtils, FIREBASE_URL, fsChangeUtils) {

        function storeChange(change) {

          var type = fsChangeUtils.getType(change);
          var objectType = fsChangeUtils.getModifiedObjectType(change);

          if (objectType !== 'http://gedcomx.org/Person') {
            return false;
          }

          var keep = false;

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
              keep = true;
              break;
            case 'http://gedcomx.org/Note':
            case 'http://familysearch.org/v1/DiscussionReference':
            case 'http://familysearch.org/v1/LivingStatus':
              keep = false;
              break;
            default:
              console.log('Unhandled Change type: ' + type);
              break;
          }

          // if (keep) {
          //   console.log('keeping ' + type);
          // } else {
          //   console.log('discarding ' + type);
          // }

          return keep;
        }

        function findPersonChanges(userId, person) {

          var rootRef = new $window.Firebase(FIREBASE_URL);
          var changesRef = rootRef.child('/changes');
          var fbChangesRef = $firebase(changesRef);          
          var userChangesRef = rootRef.child('/agents/' + userId + '/changes');
          var fbUserChangesRef = $firebase(userChangesRef);
          
          fsApi.getPersonChanges(person.id).then(function(response) {

            var changes = response.getChanges();

            for (var i = 0, len = changes.length; i < len; i++) {

              var change = changes[i];

              if (storeChange(change)) {
                var changeObj = {
                  id: change.id,
                  subjectType: 'person',
                  subjectId: person.id,
                  updated: change.updated
                };

                fbUserChangesRef.$set(change.id, true);
                fbChangesRef.$update(change.id, changeObj);
              }
            }
          });
        }

        function storePerson(userId, personId, personsRef, userPersonsRef) {
          ftrUtils.getPersonLastModified(personId).then(function(lastModified) {
            var timestamp = Date.parse(lastModified);
            $firebase(personsRef.child(personId)).$set(timestamp);
            $firebase(userPersonsRef.child(personId)).$set(timestamp);
          });
        }

        function isPersonChanged(personId, fbTimestamp) {
          ftrUtils.getPersonLastModified(personId).then(function(lastModified) {
            var timestamp = Date.parse(lastModified);
            if (timestamp === fbTimestamp) {
              return false;
            }
            else {
              return true;
            }
          });
        }

      return {
        updateWatchlist: function(userId, watchlist) {

          var rootRef = new $window.Firebase(FIREBASE_URL);

          fsApi.getAncestry(watchlist.rootId, {
            generations: watchlist.generations,
            personDetails: false,
            marriageDetails: false
          }).then(function(response) {

            var personsRef = rootRef.child('/persons');
            var userPersonsRef = rootRef.child('/agents/' + userId + '/persons');

            var persons = response.getPersons();

            for (var i = 0, len = persons.length; i < len; i++) {
              var person = persons[i];

              // we must not display or store living persons
              if (!person.living) {

                storePerson(userId, person.id, personsRef, userPersonsRef);
                findPersonChanges(userId, person);
              }
              else {
                console.log('Skipping living person ' + person.display.name);
              }
            }
          });

        },
        getChangedPersonIdsForUser: function(userId) {
          var deferred = $q.defer();
          var personIds = [];
          var rootRef = new $window.Firebase(FIREBASE_URL);
          var userPersonsIds = $firebase(rootRef.child('/agents/' + userId + '/persons')).$asArray();
          userPersonsIds.$loaded().then(function() {
            for (var i = 0, len = userPersonsIds.length; i < len; i++) {
              if (isPersonChanged(userPersonsIds.$keyAt(i), userPersonsIds[i])) {
                personIds.push(userPersonsIds.$keyAt(i));
              }
            }
          });

          deferred.resolve(personIds);
          return deferred.promise;
        }
      };
    });
})();