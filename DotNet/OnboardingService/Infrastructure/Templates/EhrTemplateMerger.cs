using System.Text.Json;
using System.Text.Json.Nodes;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Templates;

// ---------------------------------------------------------------------------
// Merges an EhrVendorTemplate.DefinitionJson with facility-specific values
// supplied by the onboarding wizard. Any string value of the form "${Key}"
// is replaced wholesale (string, object, or array) by context[Key].
// ---------------------------------------------------------------------------
public static class EhrTemplateMerger
{
    public static JsonNode Merge(string definitionJson, Dictionary<string, object?> context)
    {
        var node = JsonNode.Parse(definitionJson)
            ?? throw new InvalidOperationException("Template definition is not valid JSON.");
        return Substitute(node, context) ?? new JsonObject();
    }

    private static JsonNode? Substitute(JsonNode? node, Dictionary<string, object?> context)
    {
        switch (node)
        {
            case JsonObject obj:
                var result = new JsonObject();
                foreach (var (key, value) in obj)
                    result[key] = ResolveValue(value, context);
                return result;

            case JsonArray arr:
                var resultArr = new JsonArray();
                foreach (var item in arr)
                    resultArr.Add(Substitute(item, context));
                return resultArr;

            default:
                return node?.DeepClone();
        }
    }

    private static JsonNode? ResolveValue(JsonNode? value, Dictionary<string, object?> context)
    {
        if (value is JsonValue jv && jv.TryGetValue<string>(out var s) && TryGetToken(s, out var token))
        {
            return context.TryGetValue(token, out var replacement)
                ? JsonSerializer.SerializeToNode(replacement)
                : null;
        }

        return Substitute(value, context);
    }

    private static bool TryGetToken(string value, out string token)
    {
        if (value.StartsWith("${") && value.EndsWith("}") && value.Length > 3)
        {
            token = value[2..^1];
            return true;
        }

        token = string.Empty;
        return false;
    }
}
