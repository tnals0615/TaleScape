const iconMoon = document.getElementById("moon");

iconMoon.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

tinymce.init({
  selector: "#wysiwyg-editor",
  menubar: false,
  plugins: "lists link image preview",
  toolbar:
    "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image preview",
  height: 500,
});
