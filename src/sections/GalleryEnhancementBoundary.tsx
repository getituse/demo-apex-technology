import { Component, type ReactNode } from "react";

export class GalleryEnhancementBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? (
      <p role="status">The image viewer is unavailable. The images remain visible above.</p>
    ) : (
      this.props.children
    );
  }
}
