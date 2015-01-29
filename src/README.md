# PeerTrees Design

## Firebase Data

```
production/
  |- users/
  |  |- uid1/
  |  |- uid2/
  |  |  |- presence: online
  |  |  |- reviewer: true
  |  |  |- changes/
  |  |  |  |- cid1: fs-timestamp (priority = -fs-timestamp)
  |  |  |  |- cid2: fs-timestamp
  |  |  |- approvals/
  |  |  |  |- cid3
  |  |  |  |- cid4
  |  |  |- reviewing/
  |  |  |  |- cid5
  |  |  |  |- cid7
  |  |  |- persons/
  |  |  |  |- pid1: fs-timestamp
  |  |  |  |- pid2: fs-timestamp  
  |- changes/
  |  |- cid1/
  |  |- cid2/
  |  |  |- subjectType: 'person'
  |  |  |- subjectId: pid4
  |  |  |- approvals/
  |  |  |  |- uid1: true
  |  |  |  |- uid2: false
  |  |  |- reviewers/
  |  |  |  |- uid1: true
  |  |  |  |- uid2: false
  |  |  |- users/
  |  |  |  |- uid1: true
  |  |  |  |- uid4: true
  |  |  |- comments/
  |  |  |  |- #1/
  |  |  |    |- uid1
  |  |  |    |- updated: fb-timestamp
  |  |  |    |- text
  |- persons/
     |- pid1: fs-timestamp
     |- pid2: fs-timestamp


```


