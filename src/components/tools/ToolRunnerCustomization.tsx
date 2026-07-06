'use client';

import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

type ToolRunnerText = {
  actionButtonText?: string;
  actionButtonColor?: string;
  resetButtonText?: string;
  processingButtonText?: string;
  resultTitle?: string;
  resultEmptyText?: string;
  resultSuccessText?: string;
  privacyMessage?: string;
};

const ToolRunnerTextContext = createContext<ToolRunnerText>({});

export function useToolRunnerText() {
  return useContext(ToolRunnerTextContext);
}

export function ToolRunnerCustomization({
  label,
  color,
  resetButtonText,
  processingButtonText,
  resultTitle,
  resultEmptyText,
  resultSuccessText,
  privacyMessage,
  children,
}: {
  label?: string;
  color?: string;
  resetButtonText?: string;
  processingButtonText?: string;
  resultTitle?: string;
  resultEmptyText?: string;
  resultSuccessText?: string;
  privacyMessage?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const value = useMemo<ToolRunnerText>(() => ({
    actionButtonText: label,
    actionButtonColor: color,
    resetButtonText,
    processingButtonText,
    resultTitle,
    resultEmptyText,
    resultSuccessText,
    privacyMessage,
  }), [label, color, resetButtonText, processingButtonText, resultTitle, resultEmptyText, resultSuccessText, privacyMessage]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    let observer: MutationObserver | null = null;
    let timeout: number | undefined;

    const apply = () => {
      const button = host.querySelector('.tool-workspace .panel:first-child .btn-primary') as HTMLElement | null;
      const heading = host.querySelector('.tool-workspace > .panel:last-child h3') as HTMLElement | null;

      if (button && label) {
        button.dataset.customLabel = label;
        button.classList.add('cms-custom-button-label');
      }

      if (heading && resultTitle && heading.textContent !== resultTitle) {
        heading.textContent = resultTitle;
      }

      if (button && (!resultTitle || heading)) {
        observer?.disconnect();
        if (timeout !== undefined) window.clearTimeout(timeout);
      }
    };

    apply();
    observer = new MutationObserver(apply);
    observer.observe(host, { childList: true, subtree: true });
    timeout = window.setTimeout(() => observer?.disconnect(), 10_000);

    return () => {
      observer?.disconnect();
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [label, resultTitle]);

  return (
    <ToolRunnerTextContext.Provider value={value}>
      <div
        ref={ref}
        className="tool-runner-custom"
        style={{ '--tool-action-color': color || 'var(--primary)' } as React.CSSProperties}
      >
        {children}
      </div>
    </ToolRunnerTextContext.Provider>
  );
}
