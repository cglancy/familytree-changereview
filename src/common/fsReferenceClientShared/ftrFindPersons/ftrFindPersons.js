(function(){
  'use strict';
  angular.module('fsReferenceClientShared')

    .factory('ftrFindPersons', function($q, fsApi, $window, $firebase, ftrUtils, FIREBASE_URL, fsChangeUtils, ftrChangeUtils, ftrPersonsCache) {

        function findPersonChanges(userId, person) {

          var rootRef = new $window.Firebase(FIREBASE_URL);
          var changesRef = rootRef.child('/changes');
          var fbChangesRef = $firebase(changesRef);          
          var userChangesRef = rootRef.child('/users/' + userId + '/changes');
          //var fbUserChangesRef = $firebase(userChangesRef);
          
          fsApi.getPersonChanges(person.id).then(function(response) {

            var changes = response.getChanges();

            for (var i = 0, len = changes.length; i < len; i++) {

              var change = changes[i];

              if (ftrChangeUtils.isChangeOfInterest(change)) {

                var changeObj = {
                  subjectType: 'person',
                  subjectId: person.id,
                  users: {}
                };

                changeObj.users[userId] = true;

                userChangesRef.child(change.id).setWithPriority(change.updated, -change.updated);
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

      return {
        updateWatchlist: function(userId, watchlist) {

          var rootRef = new $window.Firebase(FIREBASE_URL);

          fsApi.getAncestry(watchlist.rootId, {
            generations: watchlist.generations,
            personDetails: false,
            marriageDetails: false
          }).then(function(response) {

            var personsRef = rootRef.child('/persons');
            var userPersonsRef = rootRef.child('/users/' + userId + '/persons');

            var persons = response.getPersons();

            for (var i = 0, len = persons.length; i < len; i++) {
              var person = persons[i];

              // we must not display or store living persons
              if (!person.living) {
                storePerson(userId, person.id, personsRef, userPersonsRef);
                findPersonChanges(userId, person);
              }
            }
          });
        },

        updatePerson: function(userId, personId) {
          
          var rootRef = new $window.Firebase(FIREBASE_URL);
          var personsRef = rootRef.child('/persons');
          var userPersonsRef = rootRef.child('/users/' + userId + '/persons');
          storePerson(userId, personId, personsRef, userPersonsRef);

          ftrPersonsCache.getPerson(personId).then(function(person) {
            findPersonChanges(userId, person);
          });
        }

      };
    });
})();