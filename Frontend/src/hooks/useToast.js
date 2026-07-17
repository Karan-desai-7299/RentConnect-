export function useToast() {
  const showToast = (message, type = "success") => {
    // Find or create container
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.position = "fixed";
      container.style.bottom = "24px";
      container.style.right = "24px";
      container.style.zIndex = "99999";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "10px";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    // Use the exact classes already defined in index.css
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    // Override absolute positioning defined in .toast class so they stack inside the container
    toast.style.position = "static";
    toast.style.margin = "0";

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.5s ease-out";
      setTimeout(() => {
        toast.remove();
        if (container.childNodes.length === 0) {
          container.remove();
        }
      }, 500);
    }, 3000);
  };

  return showToast;
}
export default useToast;
