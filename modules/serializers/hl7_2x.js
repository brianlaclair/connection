class HL7Parser {
    constructor(raw, segmentSeparator = "\n") {
        this.raw = raw.trim();
        this.error = false;

        if (this.isValidMessage(this.raw)) {
            this.message = this.deserialize(this.raw, segmentSeparator);
        } else {
            this.error = true;
        }
    }

    // Check if the HL7 message is valid
    isValidMessage(input = this.raw) {
        return input.startsWith("MSH");
    }

    // Deserialize HL7 message into an object
    deserialize(input, segmentSeparator = "\n") {
        const meta = {
            fieldSeparator: input[3],
            componentSeparator: input[4],
            repetitionSeparator: input[5],
            escapeCharacter: input[6],
            subcomponentSeparator: input[7],
        };

        const segments = input.split(segmentSeparator).map((segment, order) => {
            const fields = segment.split(meta.fieldSeparator);
            const segmentType = fields[0].toUpperCase();

            return {
                type: segmentType,
                order,
                fields: segmentType === "MSH"
                    ? this.processMSH(fields, meta)
                    : fields.map(field => field.split(meta.componentSeparator)),
            };
        });

        return { ...meta, segments };
    }

    // Process MSH fields
    processMSH(fields, meta) {
        return [
            ["MSH"],
            [meta.fieldSeparator], // MSH.1 is the field separator
            [`${meta.componentSeparator}${meta.repetitionSeparator}${meta.escapeCharacter}${meta.subcomponentSeparator}`],
            ...fields.slice(1).map(field => field.split(meta.componentSeparator)), // Start at MSH.3
        ];
    }

    // Serialize the HL7 message back into a string
    serialize(segmentSeparator = "\n") {
        if (!this.message) {
            throw new Error("No message available to serialize.");
        }

        const {
            fieldSeparator,
            componentSeparator,
            subcomponentSeparator,
            segments,
        } = this.message;

        const serializeField = field =>
            Array.isArray(field)
                ? field.map(component =>
                      Array.isArray(component) ? component.join(subcomponentSeparator) : component
                  ).join(componentSeparator)
                : field;

        const serializeSegment = ({ type, fields }) => {
            const serializedFields = [...fields];
            if (type === "MSH") {
                serializedFields.splice(1, 2);
            }
            return serializedFields.map(serializeField).join(fieldSeparator);
        };

        return segments.map(serializeSegment).join(segmentSeparator);
    }

    // Retrieve segments by type
    getSegmentsByType(segmentType) {
        return this.message.segments.filter(segment => segment.type === segmentType);
    }

    // Retrieve a value based on a dot-separated path
    getValue(path) {
        const [segmentType, fieldIndex, componentIndex] = path
            .split(".")
            .map(part => (isNaN(part) ? part : parseInt(part)));

        const segments = this.getSegmentsByType(segmentType);
        if (!segments.length) {
            throw new Error(`Segment "${segmentType}" not found.`);
        }

        const values = segments.map(({ fields }) => {
            const field = fields[fieldIndex];
            if (!field) return null;

            return componentIndex !== undefined
                ? field[componentIndex - 1] || null
                : field.join(this.message.componentSeparator);
        });

        return values.length === 1 ? values[0] : values;
    }

    // Set a value at a specific path
    setValue(path, value) {
        const [segmentType, fieldIndex, componentIndex] = path
            .split(".")
            .map(part => (isNaN(part) ? part : parseInt(part)));

        const segments = this.getSegmentsByType(segmentType);
        if (!segments.length) {
            throw new Error(`Segment "${segmentType}" not found.`);
        }

        segments.forEach(segment => {
            while (segment.fields.length <= fieldIndex) {
                segment.fields.push([]);
            }

            const field = segment.fields[fieldIndex];
            if (componentIndex !== undefined) {
                while (field.length <= componentIndex - 1) {
                    field.push("");
                }
                field[componentIndex - 1] = value;
            } else {
                segment.fields[fieldIndex] = value.split(this.message.componentSeparator);
            }
        });
    }
}

export default HL7Parser;
