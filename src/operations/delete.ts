import type { ValueType } from "../schema/types";
import type { Cache } from "../Cache";
import type { SelectorNode } from "../language/ast";
import { modify } from "./modify";
import { identify } from "../utils/cache";

interface DeleteOptions {
  id?: unknown;
  optimistic?: boolean;
  select?: SelectorNode;
  type: ValueType;
}

export interface DeleteResult {
  updatedEntityIDs?: string[];
}

export function executeDelete(
  cache: Cache,
  options: DeleteOptions
): DeleteResult {
  const result: DeleteResult = {};
  const entityID = identify(options.type, options.id);

  if (!entityID) {
    return result;
  }

  const entity = cache.get(entityID, options.optimistic);

  if (!entity) {
    return result;
  }

  const updatedEntityIDs = modify({
    cache,
    optimistic: options.optimistic,
    entityID: entity.id,
    selector: options.select,
    type: options.type,
    onEntity: (ctx, entity, selectionSet) => {
      if (!selectionSet) {
        ctx.entities[entity.id] = undefined;
        return false;
      }
    },
    onField: (_ctx, parent, field) => {
      if (!field.selectionSet) {
        delete parent[field.name.value];
        return false;
      }
    },
  });

  if (updatedEntityIDs.length) {
    result.updatedEntityIDs = updatedEntityIDs;
  }

  return result;
}
