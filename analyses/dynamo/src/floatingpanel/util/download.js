export function download(id, template) {
  const save_link = document.createElement("a");
  save_link.href = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(template)
  )}`;
  save_link.download = id + ".dyn";
  const event = new MouseEvent("click", { bubbles: false, cancelable: false });
  save_link.dispatchEvent(event);
}
