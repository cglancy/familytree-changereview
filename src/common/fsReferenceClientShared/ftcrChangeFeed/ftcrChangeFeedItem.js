(function(){
  //'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ChangeFeedItem', function(fsChangeUtils) {

      function ChangeFeedItem(change) {
        this.id = change.id;
        this.title = change.title;
        this.updated = change.updated;

        this.agentName = change.$getAgentName();
        this.changeReason = change.$getChangeReason();

        this.type = fsChangeUtils.getType(change);
        this.changedItemId = fsChangeUtils.getChangedItemId(change);

        if (fsChangeUtils.isChildAndParentsRelationshipModified(change)) {
          this.changedType = 'Child And Parents Relationship';
        }
        else if (fsChangeUtils.isCoupleRelationshipModified(change)) {
          this.changedType = 'Couple Relationship';
        }
        else if (fsChangeUtils.isPersonModified(change)) {
          this.changedType = 'Person';
        }

      }

      return ChangeFeedItem;
    });
})();