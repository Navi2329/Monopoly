// Helper utilities for safe socket emission
class SafeEmitter {
  static deepClean(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular Reference]';
    }
    seen.add(obj);

    // Handle specific problematic types
    if (obj instanceof Set) {
      return Array.from(obj).map(item => SafeEmitter.deepClean(item, seen));
    }
    if (obj instanceof Map) {
      const result = {};
      for (const [key, value] of obj.entries()) {
        result[key] = SafeEmitter.deepClean(value, seen);
      }
      return result;
    }
    
    // Skip functions and timer objects
    if (typeof obj === 'function' || 
        (obj.constructor && obj.constructor.name === 'Timeout') ||
        (obj._handle && obj._handle.constructor && obj._handle.constructor.name === 'TimerWrap')) {
      return '[Function/Timer Removed]';
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => SafeEmitter.deepClean(item, seen));
    }

    // Handle plain objects
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          cleaned[key] = SafeEmitter.deepClean(obj[key], seen);
        } catch (error) {
          cleaned[key] = '[Serialization Error]';
        }
      }
    }
    return cleaned;
  }

  static safeEmit(io, roomId, event, data) {
    // console.log(`[DEBUG SAFEEMITTER] Attempting to emit event '${event}' to room '${roomId}'`);
    // console.log(`[DEBUG SAFEEMITTER] Data type:`, typeof data);
    // console.log(`[DEBUG SAFEEMITTER] Data preview:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    try {
      const cleanData = SafeEmitter.deepClean(data);
      // console.log(`[DEBUG SAFEEMITTER] Data cleaned successfully, emitting to room...`);
      io.to(roomId).emit(event, cleanData);
      // console.log(`[DEBUG SAFEEMITTER] Event '${event}' emitted successfully to room '${roomId}'`);
    } catch (error) {
      // console.error(`[EMIT ERROR] Failed to emit event '${event}' to room '${roomId}':`, error.message);
      // console.error(`[EMIT ERROR] Stack trace:`, error.stack);
      // Emit a simple fallback
      try {
        io.to(roomId).emit(event, { 
          error: 'Data serialization error', 
          timestamp: Date.now(),
          originalEvent: event
        });
      } catch (fallbackError) {
        // console.error(`[CRITICAL] Even fallback emit failed for room '${roomId}':`, fallbackError.message);
      }
    }
  }
}

module.exports = SafeEmitter;
