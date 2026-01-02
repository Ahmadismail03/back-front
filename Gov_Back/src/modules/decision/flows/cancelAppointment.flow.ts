import { updateContext } from "../conversation.state";

type UpcomingAppointment = {
    id: string;
    appointmentDate: string;
    service: { canonicalName: string };
};

export async function handleCancelAppointmentFlow(
    senderId: string,
    text: string,
    context: any,
    SERVICE_API_BASE_URL: string
) {

    // اختيار الموعد
    if (context.cancelFlow?.step === "ASK_WHICH_APPOINTMENT") {
        const normalizedText = text.trim();

        // محاولة اختيار برقم
        let appointment: UpcomingAppointment | undefined;

        const index = parseInt(normalizedText, 10) - 1;
        if (!isNaN(index)) {
            appointment = context.appointments?.[index];
        }

        // إذا مش رقم محاولة مطابقة اسم الخدمة
        if (!appointment) {
            appointment = context.appointments?.find((a: UpcomingAppointment) =>
                a.service.canonicalName.includes(normalizedText) ||
                normalizedText.includes(a.service.canonicalName)
            );
        }

        if (!appointment) {
            const message =
                "ما قدرت أحدد أي موعد. احكيلي رقم الموعد من القائمة.";
            updateContext(senderId, { lastBotMessage: message });
            return {
                handled: true,
                response: { ok: true, stage: "SERVICE", message },
            };
        }

        if (!appointment) {
            const message = "الاختيار غير صحيح، جرب رقم من القائمة.";
            updateContext(senderId, { lastBotMessage: message });
            return { handled: true, response: { ok: true, stage: "SERVICE", message } };
        }

        updateContext(senderId, {
            cancelFlow: {
                step: "CONFIRM_CANCEL",
                appointmentId: appointment.id,
            },
            appointments: undefined,
            stage: "CONFIRM",
        });

        const message = `هل أنت متأكد إنك بدك تلغي موعد:
"${appointment.service.canonicalName}" بتاريخ ${new Date(
            appointment.appointmentDate
        ).toLocaleDateString("ar-EG")}؟
(نعم / لا)`;

        updateContext(senderId, { lastBotMessage: message });

        return { handled: true, response: { ok: true, stage: "CONFIRM", message } };
    }

    // تأكيد الإلغاء
    if (context.cancelFlow?.step === "CONFIRM_CANCEL") {
        const normalized = text.trim();
        const yesWords = ["نعم", "اه", "آه", "موافق", "تمام"];
        const noWords = ["لا", "مش", "الغاء"];

        const isYes = yesWords.some((w) => normalized.includes(w));
        const isNo = noWords.some((w) => normalized.includes(w));

        if (!isYes && !isNo) {
            const message = "بس للتأكيد، بدك تلغي الموعد؟ نعم أو لا.";
            updateContext(senderId, { lastBotMessage: message });
            return { handled: true, response: { ok: true, stage: "CONFIRM", message } };
        }

        if (isNo) {
            updateContext(senderId, { cancelFlow: undefined, stage: "SERVICE" });
            const message = "تمام، ما لغينا الموعد.";
            updateContext(senderId, { lastBotMessage: message });
            return { handled: true, response: { ok: true, stage: "SERVICE", message } };
        }

        // YES → cancel
        const res = await fetch(
            `${SERVICE_API_BASE_URL}/appointments/${context.cancelFlow.appointmentId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${context.authToken}`,
                },
            }
        );

        if (!res.ok) {
            const message = "صار في مشكلة بإلغاء الموعد. جرب لاحقًا.";
            updateContext(senderId, { lastBotMessage: message });
            return { handled: true, response: { ok: true, stage: "SERVICE", message } };
        }

        updateContext(senderId, { cancelFlow: undefined, stage: "SERVICE" });

        const message = "تم إلغاء الموعد بنجاح.";
        updateContext(senderId, { lastBotMessage: message });

        return { handled: true, response: { ok: true, stage: "SERVICE", message } };
    }

    return { handled: false as const };
}

//Entry point
export async function startCancelAppointment(
    senderId: string,
    context: any,
    SERVICE_API_BASE_URL: string
) {
    if (!context.authToken) {
        updateContext(senderId, {
            stage: "IDENTITY",
            afterIdentity: "CANCEL_APPOINTMENT",
        });

        const message = "عشان نلغي الموعد، بدنا نتحقق من هويتك. احكيلي رقم هويتك.";
        updateContext(senderId, { lastBotMessage: message });

        return { ok: true, stage: "IDENTITY", message };
    }

    const resAppointments = await fetch(
        `${SERVICE_API_BASE_URL}/appointments/upcoming`,
        {
            headers: { Authorization: `Bearer ${context.authToken}` },
        }
    );

    const data = await resAppointments.json();
    if (!data.upcoming?.length) {
        const message = "ما عندك أي مواعيد قادمة.";
        updateContext(senderId, { lastBotMessage: message });
        return { ok: true, stage: "SERVICE", message };
    }

    const upcoming = data.upcoming as UpcomingAppointment[];

    // موعد واحد
    if (upcoming.length === 1) {
        const appointment = upcoming[0];

        updateContext(senderId, {
            cancelFlow: {
                step: "CONFIRM_CANCEL",
                appointmentId: appointment.id,
            },
            stage: "CONFIRM",
        });

        const message = `هل أنت متأكد إنك بدك تلغي موعد:
"${appointment.service.canonicalName}" بتاريخ ${new Date(
            appointment.appointmentDate
        ).toLocaleDateString("ar-EG")}؟
(نعم / لا)`;

        updateContext(senderId, { lastBotMessage: message });

        return { ok: true, stage: "CONFIRM", message };
    }

    // أكثر من موعد
    updateContext(senderId, {
        cancelFlow: { step: "ASK_WHICH_APPOINTMENT" },
        appointments: upcoming,
        stage: "SERVICE",
    });
    const message = `أي موعد بدك تلغيه؟
احكيلي رقم الموعد من القائمة:

${upcoming
            .map(
                (a, i) =>
                    `${i + 1}. ${a.service.canonicalName} بتاريخ ${new Date(
                        a.appointmentDate
                    ).toLocaleDateString("ar-EG")}`
            )
            .join("\n")}`;

    updateContext(senderId, { lastBotMessage: message });

    return { ok: true, stage: "SERVICE", message };
}
