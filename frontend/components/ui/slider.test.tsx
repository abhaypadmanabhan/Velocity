import { act, render } from "@testing-library/react"

import { Slider } from "@/components/ui/slider"

describe("Slider", () => {
  it("does not render script tags in thumbs", () => {
    let container: HTMLElement

    act(() => {
      ;({ container } = render(<Slider min={100} max={1000} value={[300]} />))
    })

    expect(container!.querySelector("script")).toBeNull()
  })
})
