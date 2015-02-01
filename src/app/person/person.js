(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('person', {
        url: '/person/:personId',
        controller: 'PersonController',
        templateUrl: 'person/person.tpl.html',
        data: { pageTitle: 'Person' },
          resolve: {
          person: ['$stateParams','ftrPersonsCache',function($stateParams, ftrPersonsCache) {
            return ftrPersonsCache.getPerson($stateParams.personId).then(function (p) {
              return p;
            });
          }]
        }
      });
    })
    .controller('PersonController', function ($scope, person) {

      $scope.person = person;

    });
})();
