"use client"

import * as React from "react";
import { SignaturePad } from "@ark-ui/react/signature-pad";

interface SignaturePadComponentProps {
  onSave?: (url: string) => void;
  onClear?: () => void;
  title?: string;
}

export default function SignaturePadComponent({
  onSave,
  onClear,
  title = "Sign below",
}: SignaturePadComponentProps) {
  const [localUrl, setLocalUrl] = React.useState<string>("");

  return (
    <div className="bg-neutral-900 border border-neutral-800 w-full p-4 rounded-xl flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <SignaturePad.Root
          onDrawEnd={(details) => {
            details.getDataUrl("image/png").then((url) => {
              setLocalUrl(url);
            });
          }}
          className="w-full"
        >
          <SignaturePad.Label className="text-sm font-medium text-neutral-300 mb-2 block font-outfit">
            {title}
          </SignaturePad.Label>
          <SignaturePad.Control className="relative w-full h-32 bg-neutral-950 rounded-lg border border-neutral-800">
            <SignaturePad.Segment className="w-full h-full stroke-white fill-white" />
            <SignaturePad.ClearTrigger
              className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-white text-xs bg-neutral-800/80 hover:bg-neutral-800 rounded cursor-pointer transition"
              onClick={() => {
                setLocalUrl("");
                if (onClear) onClear();
              }}
            >
              Clear
            </SignaturePad.ClearTrigger>
            <SignaturePad.Guide className="absolute bottom-4 left-2 right-2 border-b border-dashed border-neutral-700" />
          </SignaturePad.Control>
        </SignaturePad.Root>

        {localUrl && (
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-neutral-400 font-outfit">
                Signature Preview
              </h3>
              <div className="border border-neutral-800 rounded-lg p-2 bg-neutral-950 flex items-center justify-center">
                <img
                  src={localUrl}
                  alt="Signature preview"
                  className="h-12 object-contain filter invert"
                />
              </div>
            </div>
            
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={() => {
                  if (onSave) onSave(localUrl);
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold shadow-md cursor-pointer transition font-outfit uppercase tracking-wider"
              >
                Save Signature
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
