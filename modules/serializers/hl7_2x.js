// hl7_2x.js
// =========================
// A serializer / deserializer for HL7 2.x

class hl7_2x {

    raw     = "";
    message;
    error   = false;

    constructor (raw, segment_separator = "\n") {
        this.raw = raw.trim();

        if (this.getValidity()) {
            this.message = this.deserialize(raw, segment_separator);
        } else {
            this.error = true;
        }
    }

    getValidity(input = this.raw) {
        // If the first three characters are "MSH"
        if (input.slice(0, 3) === "MSH") {
            return true;
        }

        return false;
    }

    deserialize (input, segment_separator = "\n") {
        var item        = {};
        var order_count = 0;
        input           = input.trim();

        item.field_seperator         = input[3];
        item.component_seperator     = input[4];
        item.repetition_seperator    = input[5];
        item.escape_character        = input[6];
        item.subcomponent_separator  = input[7];

        input = input.split(segment_separator);

        input.forEach(segment => {
            let fields = segment.split(item.field_seperator);
            let segment_type = fields[0].toUpperCase();
            
            segment = {
                order: order_count,
                fields: []
            };

            order_count++;

            if (segment_type === "MSH") {
                segment.fields[0] = ["MSH"];
                segment.fields[1] = [item.field_seperator];
                segment.fields[2] = [`${item.component_seperator}${item.repetition_seperator}${item.escape_character}${item.subcomponent_separator}`];
                fields.shift();
                fields.shift();
            }

            fields.forEach(field => {
                segment.fields.push(field.split(item.component_seperator));
            })

            item[segment_type] = item[segment_type] ?? [];
            item[segment_type].push(segment);
        });

        return item;
    }
    
    getSerialized(segment_separator = "\n") {
        if (!this.message) {
            throw new Error("No message available to serialize.");
        }
    
        const { field_seperator, component_seperator, repetition_seperator, escape_character, subcomponent_separator, ...segments } = this.message;
    
        const serializeField = (field) => {
            if (Array.isArray(field)) {
                return field.map(component => Array.isArray(component) ? component.join(subcomponent_separator) : component).join(component_seperator);
            }
            return field;
        };
    
        const serializeSegment = (segmentType, segment) => {
            let fields = segment.fields.map(serializeField);
            if (segmentType === "MSH") {
               // Remove fields[1]
               fields.splice(1, 1);
            } 
            return `${fields.join(field_seperator)}`;
        };
    
        let serializedMessage = Object.entries(segments)
            .filter(([key]) => key !== "order") // Exclude meta properties like `order`
            .flatMap(([segmentType, segmentArray]) => 
                segmentArray.map(segment => serializeSegment(segmentType, segment))
            )
            .join(segment_separator);
    
        return serializedMessage;
    }

    getValue(path) {
        const [segmentType, fieldIndex, componentIndex] = path.split(".").map(part => (isNaN(part) ? part : parseInt(part)));

        if (!this.message[segmentType]) {
            throw new Error(`Segment "${segmentType}" not found in the message.`);
        }
    
        const results = this.message[segmentType].map(segment => {
            const field = segment.fields[fieldIndex];
    
            if (!field) {
                return null; // Field not found
            }
    
            if (componentIndex !== undefined) {
                return field[componentIndex - 1] ?? null; // Return specific component or null if missing
            }
    
            // If no componentIndex, return the entire field as a string
            return field.join(this.message.component_seperator);
        });
    
        // Return a single value if there's only one segment, or an array if multiple
        return results.length === 1 ? results[0] : results;
    }

    setValue(path, value) {
        const [segmentType, fieldIndex, componentIndex] = path.split(".").map(part => (isNaN(part) ? part : parseInt(part)));
    
        if (!this.message[segmentType]) {
            throw new Error(`Segment "${segmentType}" not found in the message.`);
        }
    
        const fieldIdx = fieldIndex;
        const compIdx = componentIndex ? componentIndex - 1 : undefined;
    
        this.message[segmentType].forEach(segment => {
            while (segment.fields.length <= fieldIdx) {
                segment.fields.push([]);
            }
    
            const field = segment.fields[fieldIdx];
    
            if (compIdx !== undefined) {
                while (field.length <= compIdx) {
                    field.push("");
                }
                field[compIdx] = value;
            } else {
                segment.fields[fieldIdx] = value.split(this.message.component_seperator);
            }
        });
    }
    
}

export default hl7_2x;