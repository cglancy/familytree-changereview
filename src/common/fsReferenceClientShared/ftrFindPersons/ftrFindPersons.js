(function(){
  'use strict';
  angular.module('fsReferenceClientShared')

    .factory('ftrFindPersons', function($q, fsApi, $window, $firebase, ftrUtils, FIREBASE_URL, fsChangeUtils, ftrChangeUtils, ftrPersonsCache) {

        var rootRef = new $window.Firebase(FIREBASE_URL);

        function findPersonChanges(userId, person) {
          
          fsApi.getPersonChanges(person.id).then(function(response) {

            var changes = response.getChanges();

            angular.forEach(changes, function(change) {

              if (ftrChangeUtils.isChangeOfInterest(change)) {

                var globalChangesRef = rootRef.child('changes');
                globalChangesRef.once('value', function(snapshot) {
                  if (!snapshot.hasChild(change.id)) {
                    // change does not yet exist
                    var changeObj = {
                      subjectType: 'person',
                      subjectId: person.id,
                      users: {}
                    };

                    changeObj.users[userId] = true;

                    globalChangesRef.child(change.id).set(changeObj);
                  }
                });

                var userChangesRef = rootRef.child('/users/' + userId + '/changes');
                userChangesRef.once('value', function(snapshot) {
                  if (!snapshot.hasChild(change.id)) {
                    // change does not yet exist
                    
                    // find change agentId
                    var agentUrl = change.$getAgentUrl();
                    var n = agentUrl.lastIndexOf('/');
                    var agentId = agentUrl.substring(n + 1);

                    var mine = agentId === userId;

                    var changeObj = {
                      updated: change.updated,
                      approved: false,
                      reviewing: false,
                      mine: mine
                    };

                    userChangesRef.child(change.id).set(changeObj);
                  }
                });

              }
            });
          });
        }

        function storePerson(userId, personId) {
          var personsRef = rootRef.child('/persons');
          var userPersonsRef = rootRef.child('/users/' + userId + '/persons');

          ftrUtils.getPersonLastModified(personId).then(function(lastModified) {
            var updated = Date.parse(lastModified);
            $firebase(personsRef.child(personId)).$set(updated);
            $firebase(userPersonsRef.child(personId)).$set(updated);
          });
        }

      return {
        updateWatchlist: function(userId, watchlist) {

          fsApi.getAncestry(watchlist.rootId, {
            generations: watchlist.generations,
            personDetails: false,
            marriageDetails: false
          }).then(function(response) {

            var persons = response.getPersons();

            for (var i = 0, len = persons.length; i < len; i++) {
              var person = persons[i];

              // we must not display or store living persons
              if (!person.living) {
                storePerson(userId, person.id);
                findPersonChanges(userId, person);
              }
            }
          });
        },

        updatePerson: function(userId, personId) {

          storePerson(userId, personId);

          ftrPersonsCache.getPerson(personId).then(function(person) {
            findPersonChanges(userId, person);
          });
        }

      };
    });
})();