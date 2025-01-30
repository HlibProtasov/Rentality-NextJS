import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/utils";
import * as React from "react";
import { createPortal } from "react-dom";
import RntValidationError from "./RntValidationError";
import { isEmpty } from "@/utils/string";

interface RntFilterSelectContextType {
  selected: string | undefined;
  setSelected: (value: string | undefined) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const RntFilterSelectContext = React.createContext<RntFilterSelectContextType | undefined>(undefined);

interface RntFilterSelectProps extends React.ComponentPropsWithoutRef<"select"> {
  containerClassName?: string;
  labelClassName?: string;
  label?: string;
  validationClassName?: string;
  validationError?: string;
}

const RntFilterSelectComponent = forwardRef<HTMLDivElement, RntFilterSelectProps>(
  (
    {
      children,
      className,
      containerClassName,
      labelClassName,
      label,
      validationClassName,
      validationError,
      disabled,
      id,
      placeholder,
      value,
      ...rest
    },
    ref
  ) => {
    const containerCn = cn("relative flex flex-col text-black", containerClassName);
    const labelCn = cn("text-rnt-temp-main-text whitespace-nowrap mb-1", labelClassName);
    const selectCn = cn(
      `relative flex flex-row h-12 w-full cursor-pointer items-center rounded-full border-2 border-gray-500 bg-white pl-4 pr-8 ${disabled ? "bg-gray-300" : ""}`,
      className,
      !disabled ? "active:scale-95 active:opacity-75" : "border-2 border-gray-500 text-gray-500 cursor-not-allowed"
    );
    const [selected, setSelected] = useState<string | undefined>(undefined);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement>(null);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value !== "") {
        setIsOpen(false);
      }
    }, [value]);

    useEffect(() => {
      if (value === undefined || typeof value === "string") {
        setSelected(value);
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen((prev) => !prev);
      }
    };

    useEffect(() => {
      if (!hiddenSelectRef.current) return;
      hiddenSelectRef.current.value = selected ?? "";
      hiddenSelectRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }, [selected]);

    return (
      <RntFilterSelectContext.Provider value={{ selected, setSelected, isOpen, setIsOpen, containerRef: selectRef }}>
        <div className={containerCn} ref={containerRef}>
          {/* hidden select element */}
          <select value={selected ?? ""} ref={hiddenSelectRef} hidden {...rest}>
            {React.Children.map(children, (child) =>
              React.isValidElement(child) ? (
                <option value={child.props.value} key={child.props.key}>
                  {child.props.children}
                </option>
              ) : null
            )}
          </select>

          {!isEmpty(label) && (
            <label className={labelCn} htmlFor={id}>
              {label}
            </label>
          )}
          <div ref={selectRef}>
            <div className={selectCn} id={id} ref={ref} onClick={toggleDropdown}>
              <span className="text-center">{selected || placeholder}</span>
              <svg
                className={`absolute right-4 h-[1.3rem] w-[1.3rem] transform transition ${isOpen ? "rotate-180" : "rotate-0"} `}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" stroke="currentColor" fill="none" strokeWidth="2px"></polyline>
              </svg>
            </div>
          </div>
          {isOpen && <DropdownPortal>{children}</DropdownPortal>}
          <RntValidationError className={validationClassName} validationError={validationError} />
        </div>
      </RntFilterSelectContext.Provider>
    );
  }
);

RntFilterSelectComponent.displayName = "RntFilterSelect";

function DropdownPortal({ children }: { children?: React.ReactNode }) {
  const context = React.useContext(RntFilterSelectContext);
  if (!context) throw new Error("Dropdown must be used within a RntFilterSelect");

  const { containerRef } = context;
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [containerRef]);

  if (!position) return null;

  return createPortal(
    <div
      className="absolute z-10 overflow-y-auto rounded-lg border border-gray-500 bg-rentality-bg-left-sidebar px-0 py-2 shadow-md"
      style={{
        top: `${position.top + 8}px`,
        left: `${position.left}px`,
        // width: `${position.width}px`,
        maxHeight: `calc(100vh - ${position.top + 8}px)`,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

interface OptionProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string;
}

const Option = forwardRef<HTMLDivElement, OptionProps>(({ value, children, className, ...rest }, ref) => {
  const context = React.useContext(RntFilterSelectContext);
  if (!context) throw new Error("RntFilterSelect.Option must be used within a RntFilterSelect");

  const { selected, setSelected, setIsOpen } = context;
  const isSelected = selected === value;

  return (
    <div
      ref={ref}
      className={cn(
        className,
        "flex w-full cursor-pointer flex-row items-center gap-2 px-4 transition-colors hover:bg-rentality-additional-light active:bg-rentality-additional-light"
      )}
      onClick={() => {
        setSelected(value);
        setIsOpen(false);
      }}
      role="button"
      {...rest}
    >
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 border-rentality-additional-tint bg-transparent transition-all`}
      >
        {isSelected && <div className="h-2 w-2 rounded-full bg-rentality-additional-tint"></div>}
      </div>
      <span>{value}</span>
    </div>
  );
});

Option.displayName = "FilterSelect.Option";
const RntFilterSelect = Object.assign(RntFilterSelectComponent, { Option: Option });

export default RntFilterSelect;
