// agentActionSchemas.js - JSON schemas for agent actions (Table 6.1 from spec)
export const agentActionSchemas = {
  create_object: {
    type: "object",
    properties: {
      command: { const: "create_object" },
      shape_type: { 
        enum: ["cube", "sphere", "cylinder", "cone", "torus", "pyramid"] 
      },
      position: { 
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          z: { type: "number" }
        },
        required: ["x", "y", "z"]
      },
      rotation: { 
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          z: { type: "number" }
        },
        required: ["x", "y", "z"]
      },
      scale: { 
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          z: { type: "number" }
        },
        required: ["x", "y", "z"]
      },
      color: { 
        type: "string", 
        pattern: "^#[0-9a-fA-F]{6}$" 
      },
      parent_id: { 
        type: "string",
        description: "Optional UUID of parent object"
      }
    },
    required: ["command", "shape_type", "position"]
  },

  modify_transform: {
    type: "object",
    properties: {
      command: { const: "modify_transform" },
      object_id: { type: "string" },
      position: { 
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          z: { type: "number" }
        }
      },
      rotation: { 
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          z: { type: "number" }
        }
      },
      scale: { 
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          z: { type: "number" }
        }
      }
    },
    required: ["command", "object_id"]
  },

  delete_object: {
    type: "object",
    properties: {
      command: { const: "delete_object" },
      object_id: { type: "string" }
    },
    required: ["command", "object_id"]
  },

  change_property: {
    type: "object",
    properties: {
      command: { const: "change_property" },
      object_id: { type: "string" },
      property_name: { 
        enum: ["color", "opacity", "visible"] 
      },
      property_value: { 
        type: ["string", "number", "boolean"] 
      }
    },
    required: ["command", "object_id", "property_name", "property_value"]
  },

  group_objects: {
    type: "object",
    properties: {
      command: { const: "group_objects" },
      object_ids: { 
        type: "array",
        items: { type: "string" }
      },
      new_group_id: { type: "string" }
    },
    required: ["command", "object_ids", "new_group_id"]
  }
};

// Validate an action against schemas
export function validateAgentAction(action) {
  if (!action || !action.command) {
    return { valid: false, error: "Missing command field" };
  }

  const schema = agentActionSchemas[action.command];
  if (!schema) {
    return { valid: false, error: `Unknown command: ${action.command}` };
  }

  // Simple validation (can be replaced with a JSON schema validator)
  const required = schema.required || [];
  for (const field of required) {
    if (!(field in action)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  return { valid: true };
}

export default agentActionSchemas;
