(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrUtils', function ($q, $http, fsApi, FS_URL) {

        function getLastModified(url) {
          var deferred = $q.defer();
          fsApi.getAccessToken().then(function(accessToken) {
            var config = {
              method: 'HEAD',
              url: url,
              headers: {
                Accept: 'application/x-gedcomx-v1+json',
                Authorization: 'Bearer ' + accessToken
              },
              timeout: 30000
            };

            /*jshint unused:false*/
            // $http(config).success(function(data, status, headers, config) {
            //   var modified = headers('Last-Modified');
            //   console.log('person ' + personId + ' Last-Modified = ' + modified);
            // });
            $http(config).then(function(response) {
              deferred.resolve(response.headers('Last-Modified'));
            }, function(error) {
              deferred.reject(error);
            });

          }, function(error) {
            deferred.reject(error);
          });

          return deferred.promise;       
        }

      return {
        getPersonLastModified: function(personId) {
          var deferred = $q.defer();
          getLastModified(FS_URL + '/platform/tree/persons/' + personId).then(function(lastModified) {
            deferred.resolve(lastModified);
          }, function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        }

      };
    });
})();