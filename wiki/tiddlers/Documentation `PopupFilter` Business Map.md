# Documentation for a Generic `PopupFilter` Business Map

**Map Name:** [Map_Name]

**Map Number:** [Map_Number]

**Map Type:** PopupFilter

**Target Module:** [Target_Module]

## Overview

This generic business map is designed for the coreBOS system to create a specific search in the popup of a `uitype10` field. It aids in choosing the related record.

The map can be applied to any module by replacing `<modulename>` with the module's name, thus allowing a high degree of flexibility and reusability. Additionally, it allows for multiple `advft_criteria` instances for a more complex filtering of records.

## XML Structure

```xml
<map>
  <modulename>[Module_Name]</modulename>
  <field>
    <fieldname>[Field_Name]</fieldname>
    <modulename>[Related_Module]</modulename>
    <advft_criteria>[{"groupid":1,"columnname":"[Column_Name]","comparator":"[Comparator]", "value":"[Value]","columncondition":"[Column_Condition]"}]</advft_criteria>
    <advft_criteria>[{"groupid":1,"columnname":"[Column_Name2]","comparator":"[Comparator2]", "value":"[Value2]","columncondition":"[Column_Condition2]"}]</advft_criteria>
    <advft_criteria_groups>[]</advft_criteria_groups>
  </field>
</map>
```

### Fields

- `modulename` (top-level): Specifies the module this map applies to. Replace `[Module_Name]` with the name of your target module.

- `field`: Contains information about the field being filtered.

  - `fieldname`: Name of the field. Replace `[Field_Name]` with the name of your field.

  - `modulename`: Module the field belongs to. Replace `[Related_Module]` with the name of the module that the field belongs to.

  - `advft_criteria`: Contains the criteria used to filter the field. Here, we have two instances of `advft_criteria` for more complex filtering.

    - `groupid`: Always 1, as there's only one group of conditions.

    - `columnname`: The column in the related module to apply the criteria to. Use `[Column_Name]` and `[Column_Name2]` for multiple criteria.

    - `comparator`: The operator used to compare the column value to the value provided. Use `[Comparator]` and `[Comparator2]` for multiple criteria.

    - `value`: The value to compare the column value against. Use `[Value]` and `[Value2]` for multiple criteria.

    - `columncondition`: This is used to combine multiple criteria. Use `[Column_Condition]` and `[Column_Condition2]` for each criterion respectively. Examples of `columncondition` values include "and", "or", etc.

  - `advft_criteria_groups`: Allows combining different criteria groups. It's empty in this case as there's only one criteria group.

## Usage

This map is used when the popup for a specific field in your chosen module is displayed. It filters the related records displayed in the popup based on the `advft_criteria` you set. This ensures that users can only select related records that meet the specific criteria when assigning the target field, simplifying the process of choosing the appropriate record. Multiple `advft_criteria` can be used to create complex filter conditions.
