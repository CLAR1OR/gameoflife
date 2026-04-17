"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { SkillNode, type SkillNodeData } from "./skill-node";
import { AddSkillDialog } from "./add-skill-dialog";
import { LogSessionDialog } from "./log-session-dialog";
import { Button } from "@/components/ui/button";
import type { SkillWithPrerequisites } from "@/modules/skills/types";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 100;

const nodeTypes = { skill: SkillNode };

function layoutNodes(
  skills: SkillWithPrerequisites[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  skills.forEach((s) => {
    g.setNode(s.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  const edges: Edge[] = [];
  skills.forEach((s) => {
    s.prerequisites.forEach((p) => {
      g.setEdge(p.prerequisiteId, s.id);
      const prereqMet =
        (skills.find((sk) => sk.id === p.prerequisiteId)?.level ?? 0) >=
        p.requiredLevel;
      edges.push({
        id: `${p.prerequisiteId}-${s.id}`,
        source: p.prerequisiteId,
        target: s.id,
        style: {
          stroke: prereqMet ? "#22c55e" : "#a1a1aa",
          strokeWidth: 2,
          strokeDasharray: prereqMet ? undefined : "6 3",
        },
        animated: prereqMet,
      });
    });
  });

  dagre.layout(g);

  const nodes: Node[] = skills.map((s) => {
    const pos = g.node(s.id);
    return {
      id: s.id,
      type: "skill",
      position: {
        x: (s.positionX ?? pos.x) - NODE_WIDTH / 2,
        y: (s.positionY ?? pos.y) - NODE_HEIGHT / 2,
      },
      data: {
        name: s.name,
        level: s.level,
        currentXp: s.currentXp,
        description: s.description,
        isSelected: false,
      } satisfies SkillNodeData,
    };
  });

  return { nodes, edges };
}

export function SkillTreeView({
  categoryId,
  categoryName,
  skills: initialSkills,
}: {
  categoryId: string;
  categoryName: string;
  skills: SkillWithPrerequisites[];
}) {
  const { nodes: initialNodes, edges: initialEdges } =
    useMemo(() => layoutNodes(initialSkills), [initialSkills]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const selectedSkill = initialSkills.find((s) => s.id === selectedSkillId);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedSkillId(node.id);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: n.id === node.id },
        }))
      );
    },
    [setNodes]
  );

  const onPaneClick = useCallback(() => {
    setSelectedSkillId(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isSelected: false },
      }))
    );
  }, [setNodes]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{categoryName}</h1>
        <div className="flex gap-2">
          {selectedSkill && selectedSkill.level > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogDialogOpen(true)}
            >
              Log XP for {selectedSkill.name}
            </Button>
          )}
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            Add Skill
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-lg border bg-background">
        {initialSkills.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">No skills yet</p>
              <p className="text-sm mt-1">
                Click &quot;Add Skill&quot; to create your first skill in this
                tree.
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.3}
            maxZoom={2}
          >
            <Background gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              className="!bg-muted/50"
            />
          </ReactFlow>
        )}
      </div>

      <AddSkillDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categoryId={categoryId}
        existingSkills={initialSkills}
      />

      {selectedSkill && (
        <LogSessionDialog
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
          skill={selectedSkill}
        />
      )}
    </div>
  );
}
