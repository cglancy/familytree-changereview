(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('settings', {
        url: '/settings',
        controller: 'SettingsController',
        templateUrl: 'settings/settings.tpl.html',
        data: { pageTitle: 'Settings' }
      });
    })
    .controller('SettingsController', function ($scope, fsApi, fsCurrentUserCache, fsChangeUtils, $firebase, $window, ftrFindPersons, FIREBASE_URL, ftrPersonsCache) {

        var rootRef = new $window.Firebase(FIREBASE_URL);

        fsCurrentUserCache.getUser().then(function(user) {
          $scope.agentId = user.treeUserId;

          $scope.userPersonIds = $firebase(rootRef.child('/users/' + $scope.agentId + '/persons')).$asArray();
          $scope.userPersonIds.$loaded(function() {
            $scope.personsCount = $scope.userPersonIds.length;
            getAllPersonDetails();
            $scope.userPersonIds.$watch(function(event) {
              getPersonDetails(event.key);
              $scope.personsCount = $scope.userPersonIds.length;
            });
          });
        });

        $scope.persons = {};
        $scope.personsCount = 0;


        function getPersonDetails(personId) {
          ftrPersonsCache.getPerson(personId).then(function(person) {
            $scope.persons[personId] = person;
          });
        }

        function getAllPersonDetails() {
          console.log('getting details for ' + $scope.userPersonIds.length + ' persons.');

          for (var i = 0, len = $scope.userPersonIds.length; i < len; i++) {
            getPersonDetails($scope.userPersonIds.$keyAt(i));
          }
        }

        $scope.updateDefaultWatchlist = function() {

          fsCurrentUserCache.getUser().then(function(user) {

            console.log('finding 8 generations of ancestors for id = ' + user.personId);

            var watchlist = {
              rootId: user.personId,
              type: 'ancestors',
              generations: 8
            };

            ftrFindPersons.updateWatchlist($scope.agentId, watchlist);
          });
        };




      function createParents(childId, ahnen, maxAhnen) {

        if (ahnen > maxAhnen) {
          return;
        }

        var fatherAhnen = 2*ahnen;
        var father = new fsApi.Person();
        father.$setGender('http://gedcomx.org/Male');
        father.$addName({givenName: 'Person' + fatherAhnen, surname: 'Surname'});
        var fatherDeathFact = new fsApi.Fact();
        fatherDeathFact.$setType('http://gedcomx.org/Death');
        father.$addFact(fatherDeathFact);
        father.$save('Created for testing', true).then(function(fatherId) {

          console.log('created father id = ' + fatherId + ' for person id = ' + childId);

          var motherAhnen = 2*ahnen + 1;
          var mother = new fsApi.Person();
          mother.$setGender('http://gedcomx.org/Female');
          mother.$addName({givenName: 'Person' + motherAhnen, surname: 'Surname'});
          var motherDeathFact = new fsApi.Fact();
          motherDeathFact.$setType('http://gedcomx.org/Death');
          mother.$addFact(motherDeathFact);
          mother.$save('Created for testing', true).then(function(motherId) {

            console.log('created mother id = ' + motherId + ' for person id = ' + childId);

            var rel = new fsApi.ChildAndParents();
            rel.$setFather(fatherId);
            rel.$setMother(motherId);
            rel.$setChild(childId);
            rel.$save('Created for testing').then(function() {

              var couple = new fsApi.Couple({husband: fatherId, wife: motherId});
              couple.$save('Created for testing').then(function() {

                createParents(fatherId, fatherAhnen, maxAhnen);
                createParents(motherId, motherAhnen, maxAhnen);
              });
            });
          });
        });

      }

      $scope.createAncestry = function(generations) {

        console.log('create ancestry for ' + generations + ' generations.');

        var maxAhnen = Math.pow(2, generations) - 1;

        fsCurrentUserCache.getUser().then(function(user) {
            createParents(user.personId, 1, maxAhnen);
        });
      };

    });
})();
