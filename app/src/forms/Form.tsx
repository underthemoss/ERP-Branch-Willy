import {
  FieldError,
  FieldErrors,
  useForm,
  UseFormRegister,
  UseFormRegisterReturn,
} from "react-hook-form";
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
import React, { HTMLInputTypeAttribute, useRef } from "react";

type FieldConfigComponent = {
  component: (props: {
    setValue: (value: any) => void;
    value: any;
    error: string | undefined;
  }) => React.ReactNode;
  columns: number;
};

type FieldConfig = {
  columns: number;
  label?: string;
  type?: HTMLInputTypeAttribute;
  leadingColumns?: number;
  trailingColumns?: number;
  append?: FieldConfigComponent;
  prependElement?: FieldConfigComponent;
};

type FormConfig<T extends z.ZodObject<any, any, any>> = Record<
  keyof T["shape"],
  FieldConfig
>;

type DefaultValues<T extends z.ZodObject<any, any, any>> = Partial<
  Record<keyof T["shape"], any>
>;

export const Form = <T extends z.ZodObject<any, any, any>>(props: {
  schema: T;
  uiConfig: FormConfig<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onCancel: () => void;
  formTitle?: string;
  defaultValues?: DefaultValues<T>;
  submitLabel?: string;
}) => {
  const {
    schema,
    uiConfig: config,
    onSubmit,
    onCancel,
    formTitle,
    defaultValues,
    submitLabel = "Submit",
  } = props;
  const fields = Object.keys(config);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  const isFormDisabled = isSubmitting;
  React.useEffect(() => {
    setTimeout(() => {
      setFocus(fields[0]);
    }, 0);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // this hack is fixing a 'Enter' keystroke submission issue
        requestAnimationFrame(() => {
          handleSubmit((d) => {
            onSubmit(d)
              .then(() => {})
              .catch((err) =>
                setError(
                  "server",
                  { message: err.error.message },
                  { shouldFocus: true }
                )
              );
          })();
        });
      }}
    >
      <Grid container spacing={2} m={2}>
        {formTitle && (
          <Grid xs={12}>
            <Typography level="title-lg">{formTitle}</Typography>
          </Grid>
        )}

        {fields.map((fieldKey, i) => {
          const field = schema.shape[fieldKey];
          const {
            columns,
            label,
            leadingColumns,
            trailingColumns,
            append: appendElement,
            prependElement,
            type,
          } = config[fieldKey];
          const error = errors[fieldKey as any];
          const isOptional = field?.isOptional();

          const setFieldValue = (value: any) => {
            setValue(fieldKey, value);
            trigger(fieldKey);
          };
          return (
            <React.Fragment key={fieldKey}>
              {leadingColumns && <Grid xs={leadingColumns}></Grid>}
              {prependElement && (
                <Grid xs={prependElement.columns} display={"flex"}>
                  {prependElement.component({
                    value: getValues(fieldKey),
                    setValue: setFieldValue,
                    error: error?.message?.toString(),
                  })}
                </Grid>
              )}
              {type === "hidden" ? (
                <input type="hidden" {...register(fieldKey)} />
              ) : (
                <Grid
                  xs={columns}
                  style={{
                    visibility: type === "hidden" ? "collapse" : "visible",
                  }}
                >
                  <FormControl
                    id={fieldKey}
                    required={!isOptional}
                    size="md"
                    color="neutral"
                  >
                    <FormLabel>{label || fieldKey}</FormLabel>
                    <Input
                      {...register(fieldKey)}
                      type={type}
                      autoComplete="off"
                      autoFocus={i === 0}
                      error={Boolean(error?.message)}
                      required={false} // disable native validation
                      fullWidth
                      disabled={isFormDisabled}
                    />

                    <FormHelperText>
                      {error?.message?.toString()}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              )}

              {appendElement && (
                <Grid xs={appendElement.columns} display={"flex"}>
                  {appendElement.component({
                    value: getValues(fieldKey),
                    setValue: setFieldValue,
                    error: error?.message?.toString(),
                  })}
                </Grid>
              )}
              {trailingColumns && (
                <Grid xs={trailingColumns} display={"flex"}></Grid>
              )}
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
              {submitLabel}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};
