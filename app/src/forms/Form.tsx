import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  Typography,
} from "@mui/joy";
import React from "react";

type FieldConfig = {
  columns: number;
  label?: string;
  leadingColumns?: number;
  trailingColumns?: number;
};

type FormConfig<T extends z.ZodObject<any, any, any>> = Record<
  keyof T["shape"],
  FieldConfig
>;

export const Form = <T extends z.ZodObject<any, any, any>>(props: {
  schema: T;
  config: FormConfig<T>;
  onSubmit: (data: z.infer<T>) => Promise<void> | void;
  onCancel: () => void;
  formTitle?: string;
}) => {
  const { schema, config, onSubmit, onCancel, formTitle } = props;
  const fields = Object.keys(config);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const isFormDisabled = isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(async (d) => {
        try {
          await onSubmit(d);
        } catch (err: any) {
          setError(
            "server",
            { message: err.error.message },
            { shouldFocus: true }
          );
        }
      })}
    >
      <Grid container spacing={2} m={2}>
        {formTitle && (
          <Grid xs={12}>
            <Typography level="title-lg">{formTitle}</Typography>
          </Grid>
        )}

        {fields.map((fieldKey) => {
          const field = schema.shape[fieldKey];
          const { columns, label, leadingColumns, trailingColumns } =
            config[fieldKey];
          const error = errors[fieldKey as any];
          const isOptional = field?.isOptional();

          return (
            <React.Fragment key={fieldKey}>
              {leadingColumns && <Grid xs={leadingColumns}></Grid>}
              <Grid xs={columns}>
                <FormControl
                  id={fieldKey}
                  required={!isOptional}
                  size="md"
                  color="neutral"
                >
                  <FormLabel>{label || fieldKey}</FormLabel>
                  <Input
                    {...register(fieldKey)}
                    name={fieldKey}
                    autoComplete="off"
                    autoFocus
                    error={Boolean(error?.message)}
                    required={false} // disable native validation
                    fullWidth
                    onKeyDown={(e) => e.stopPropagation()}
                    disabled={isFormDisabled}
                  />
                  <FormHelperText>{error?.message?.toString()}</FormHelperText>
                </FormControl>
              </Grid>
              {trailingColumns && <Grid xs={trailingColumns}></Grid>}
            </React.Fragment>
          );
        })}
        <Grid xs={12}>
          <Divider />
        </Grid>
        <Grid xs={12}>{errors["server"]?.message?.toString()}</Grid>
        <Grid
          container
          xs={12}
          justifyContent={"flex-end"}
          justifyItems={"flex-end"}
        >
          <Grid>
            <Button
              type="button"
              disabled={isFormDisabled}
              onClick={() => {
                onCancel();
              }}
              variant="outlined"
            >
              Cancel
            </Button>
          </Grid>
          <Grid>
            <Button type="submit" loading={isFormDisabled}>
              Submit
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};
