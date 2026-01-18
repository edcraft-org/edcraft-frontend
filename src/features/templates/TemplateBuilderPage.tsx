import { useParams } from "react-router-dom";

function TemplateBuilderPage() {
  const { templateId } = useParams<{ templateId?: string }>();
  const isEditing = !!templateId;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit Template" : "Template Builder"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditing
            ? "Edit the question template configuration"
            : "Create a question template by providing code and configuring the target (without input data)"}
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
        <p>Template Builder will reuse the Question Builder components.</p>
        <p className="text-sm mt-2">
          Key difference: The InputData section will be hidden. Users configure the code, target,
          and generation options.
        </p>
        <p className="text-sm mt-2">
          After clicking &quot;Generate Template&quot;, a preview with a sample question will be shown.
        </p>
      </div>
    </div>
  );
}

export default TemplateBuilderPage;
