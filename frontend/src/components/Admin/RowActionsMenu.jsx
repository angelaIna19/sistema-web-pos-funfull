import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_MARGIN = 8;
const MENU_GAP = 6;

export default function RowActionsMenu({
  itemId,
  ariaLabel,
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
  actions,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const menuId = `row-actions-menu-${itemId}`;

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const maxLeft = window.innerWidth - menuRect.width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(triggerRect.right - menuRect.width, maxLeft));
    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_MARGIN;
    const top = spaceBelow >= menuRect.height + MENU_GAP
      ? triggerRect.bottom + MENU_GAP
      : Math.max(VIEWPORT_MARGIN, triggerRect.top - menuRect.height - MENU_GAP);

    setPosition({ left, top });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event) {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        onOpenChange(null);
      }
    }

    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      onOpenChange(null);
      triggerRef.current?.focus();
    }

    function closeOnViewportChange() {
      onOpenChange(null);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [isOpen, onOpenChange]);

  function runAction(action) {
    onOpenChange(null);
    action();
  }

  const menuActions = actions || [
    { label: "Editar", onClick: onEdit },
    { label: "Eliminar", onClick: onDelete, danger: true },
  ];

  return (
    <div className="row-actions-trigger">
      <button
        ref={triggerRef}
        className="row-actions-button"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => onOpenChange(isOpen ? null : itemId)}
      >
        <span aria-hidden="true">⋮</span>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="row-actions-dropdown"
          id={menuId}
          role="menu"
          style={position}
        >
          {menuActions.map((action) => (
            <button
              className={action.danger ? "danger" : undefined}
              key={action.label}
              type="button"
              role="menuitem"
              onClick={() => runAction(action.onClick)}
            >
              {action.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
