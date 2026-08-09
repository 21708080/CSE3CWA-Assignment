"use client";

import { useRef } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function HowToPlayDialog({ title, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="mini-button help-button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
      >
        How to play?
      </button>

      <dialog ref={dialogRef} className="how-to-dialog" aria-labelledby="how-to-title">
        <div className="how-to-dialog-card">
          <div className="how-to-dialog-head">
            <div>
              <span className="section-kicker">Game guide</span>
              <h3 id="how-to-title">{title}</h3>
            </div>
            <button
              type="button"
              className="dialog-close"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close how to play instructions"
            >
              ×
            </button>
          </div>
          <div className="how-to-dialog-body">{children}</div>
          <div className="how-to-dialog-actions">
            <button type="button" className="primary-button" onClick={() => dialogRef.current?.close()}>
              Got it — play game
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
