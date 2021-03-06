/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule convertFromRawToDraftState
 * @flow
 */

'use strict';

var ContentBlock = require('ContentBlock');
var DraftEntity = require('DraftEntity');

var createCharacterList = require('createCharacterList');
var decodeEntityRanges = require('decodeEntityRanges');
var decodeInlineStyleRanges = require('decodeInlineStyleRanges');
var generateBlockKey = require('generateBlockKey');

import type {RawDraftContentState} from 'RawDraftContentState';

function convertFromRawToDraftState(
  rawState: RawDraftContentState
): Array<ContentBlock> {
  var {blocks, entityMap} = rawState;

  var fromStorageToLocal = {};
  Object.keys(entityMap).forEach(
    storageKey => {
      var encodedEntity = entityMap[storageKey];
      var {type, mutability, data} = encodedEntity;
      var newKey = DraftEntity.create(type, mutability, data || {});
      fromStorageToLocal[storageKey] = newKey;
    }
  );

  return blocks.map(
    block => {
      var {key, type, text, depth, inlineStyleRanges, entityRanges} = block;
      key = key || generateBlockKey();
      depth = depth || 0;
      inlineStyleRanges = inlineStyleRanges || [];
      entityRanges = entityRanges || [];

      var inlineStyles = decodeInlineStyleRanges(text, inlineStyleRanges);

      // Translate entity range keys to the DraftEntity map.
      var filteredEntityRanges = entityRanges
        .filter(range => fromStorageToLocal.hasOwnProperty(range.key))
        .map(range => {
          return {...range, key: fromStorageToLocal[range.key]};
        });

      var entities = decodeEntityRanges(text, filteredEntityRanges);
      var characterList = createCharacterList(inlineStyles, entities);

      return new ContentBlock({key, type, text, depth, characterList});
    }
  );
}

module.exports = convertFromRawToDraftState;
