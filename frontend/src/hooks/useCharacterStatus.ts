"use client";

import { useState, useEffect, useCallback } from "react";
import { characterStudioApi } from "@/lib/character-api";
import { CharacterGeneration } from "@/lib/character-types";

export function useCharacterStatus(generationId: string | null) {
  const [generation, setGeneration] = useState<CharacterGeneration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!generationId) return;
    try {
      const data = await characterStudioApi.getGenerationStatus(generationId);
      setGeneration(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve generation status");
    }
  }, [generationId]);

  useEffect(() => {
    if (!generationId) return;

    setLoading(true);
    fetchStatus().finally(() => setLoading(false));

    // Poll if in progress
    const interval = setInterval(async () => {
      try {
        const data = await characterStudioApi.getGenerationStatus(generationId);
        setGeneration(data);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(interval);
        }
      } catch (err) {
        // keep polling or log
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [generationId, fetchStatus]);

  return { generation, loading, error, refresh: fetchStatus };
}
