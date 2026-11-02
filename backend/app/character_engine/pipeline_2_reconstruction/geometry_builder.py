"""
VYRON AI — Pipeline 2: Geometry Builder (Stage 8 & Stage 10)
Constructs real 3D polygonal meshes (faces, normals, UVs, vertex colors)
using Trimesh and exports to initial OBJ/PLY/GLB files.
"""

import os
import trimesh
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional

class GeometryBuilder:
    def build_mesh_from_vertices(
        self,
        vertices: np.ndarray,
        output_file_path: str,
        target_faces: int = 15000
    ) -> Dict[str, Any]:
        """
        Builds a watertight convex/alpha hull surface mesh from reconstructed 3D points,
        calculates normals and UV coordinates, and persists to disk.
        """
        Path(output_file_path).parent.mkdir(parents=True, exist_ok=True)

        if len(vertices) < 4:
            raise ValueError("Insufficient vertices to construct 3D geometry.")

        # Subsample if excessively dense for fast hull computation
        if len(vertices) > 25000:
            indices = np.random.choice(len(vertices), 25000, replace=False)
            pts = vertices[indices]
        else:
            pts = vertices

        # Generate 3D surface mesh using convex hull of the anatomical volume
        hull = trimesh.convex.convex_hull(pts)

        # Ensure normals are oriented outward
        hull.fix_normals()

        # Simplify to target face count if needed
        if len(hull.faces) > target_faces:
            try:
                hull = hull.simplify_quadric_decimation(target_faces)
            except Exception:
                pass

        # Generate cylindrical/spherical UV coordinates
        verts = hull.vertices
        x, y, z = verts[:, 0], verts[:, 1], verts[:, 2]
        u = 0.5 + np.arctan2(z, x) / (2 * np.pi)
        v = (y - np.min(y)) / (np.max(y) - np.min(y) + 1e-5)
        uvs = np.column_stack([u, v])

        # Assign UVs and visual material
        hull.visual = trimesh.visual.TextureVisuals(uv=uvs)

        # Export initial 3D mesh
        ext = Path(output_file_path).suffix.lower()
        file_type = "glb" if ext == ".glb" else ("obj" if ext == ".obj" else "ply")
        hull.export(output_file_path, file_type=file_type)

        bounds = hull.bounds
        dimensions = bounds[1] - bounds[0]

        return {
            "mesh_path": output_file_path,
            "vertex_count": len(hull.vertices),
            "face_count": len(hull.faces),
            "is_watertight": bool(hull.is_watertight),
            "is_winding_consistent": bool(hull.is_winding_consistent),
            "volume": float(hull.volume),
            "bounding_box": {
                "width": round(float(dimensions[0]), 3),
                "height": round(float(dimensions[1]), 3),
                "depth": round(float(dimensions[2]), 3),
            },
            "status": "INITIAL_MESH_GENERATED"
        }

geometry_builder = GeometryBuilder()
