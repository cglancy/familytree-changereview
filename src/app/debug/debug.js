(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('debug', {
        url: '/debug',
        controller: 'DebugController',
        templateUrl: 'debug/debug.tpl.html',
        data: { pageTitle: 'Debug' }
      });
    })
    .controller('DebugController', function ($scope, fsCurrentUserCache, fsApi) {

      function createParents(childId, ahnen, maxAhnen) {

        if (ahnen > maxAhnen) {
          return;
        }

        var fatherAhnen = 2*ahnen;
        var father = new fsApi.Person();
        father.$setGender('http://gedcomx.org/Male');
        father.$addName({givenName: 'Person' + fatherAhnen, surname: 'Surname'});
        father.$save('Created for testing', true).then(function(fatherId) {

          console.log('created father id = ' + fatherId + ' for person id = ' + childId);

          var motherAhnen = 2*ahnen + 1;
          var mother = new fsApi.Person();
          mother.$setGender('http://gedcomx.org/Female');
          mother.$addName({givenName: 'Person' + motherAhnen, surname: 'Surname'});
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
