import { signal } from "@preact/signals";
import { Forma } from "forma-embedded-view-sdk/auto";
import { Project } from "forma-embedded-view-sdk/dist/internal/project";

const projectState = signal<Project | undefined>(undefined);
export async function getCurrentProject() {
  const project = projectState.peek();
  if (project) {
    return project;
  }
  const res = await Forma.project.get();
  projectState.value = res;
  return res;
}
